const express = require("express");
const http = require("http");
const cors = require("cors");
const crypto = require("crypto");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "https://neptunechat.app",
      "https://www.neptunechat.app",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
    ],
    methods: ["GET", "POST"],
  },
  // #13 Heartbeat: socket.io's built-in ping/pong. If a client doesn't
  // respond within pingTimeout after a ping, it's dropped -> triggers
  // "disconnect" -> endChat() cleans up the queue/pair automatically.
  pingInterval: 15000,
  pingTimeout: 8000,
});

// ---------------------------------------------------------------------------
// #12 User states
// ---------------------------------------------------------------------------
const UserState = Object.freeze({
  WAITING: "WAITING",
  MATCHED: "MATCHED",
  IDLE: "IDLE", // connected, not searching
  DISCONNECTED: "DISCONNECTED",
});

// #6 Set instead of array -> no duplicates, O(1) add/remove/has
const waitingQueue = new Set();

// socketId -> { state, partnerId, lastPartnerId, joinedQueueAt, rate: {} }
const users = new Map();

// #11 Matchmaking lock: prevents re-entrant tryMatch() calls from
// stacking on top of each other within the same tick.
let isMatching = false;

// #14 Stats
const stats = {
  matchesMade: 0,
  totalWaitTimeMs: 0,
};

function log(...args) {
  console.log(`[${new Date().toISOString()}]`, ...args);
}

function getUser(socketId) {
  return users.get(socketId);
}

function ensureUser(socketId) {
  let u = users.get(socketId);
  if (!u) {
    u = {
      state: UserState.IDLE,
      partnerId: null,
      lastPartnerId: null,
      joinedQueueAt: null,
      rate: {},
    };
    users.set(socketId, u);
  }
  return u;
}

function emitStatus(socketId, status, extra = {}) {
  const socket = io.sockets.sockets.get(socketId);
  if (socket) socket.emit("status", { status, ...extra });
}

function removeFromQueue(socketId) {
  waitingQueue.delete(socketId); // #1 Set.delete is idempotent, no-op if absent
}

// #16 Simple sliding-window rate limiter per socket per event
function isRateLimited(socketId, eventName, maxCount, windowMs) {
  const u = ensureUser(socketId);
  const now = Date.now();
  const bucket = u.rate[eventName] || { count: 0, windowStart: now };

  if (now - bucket.windowStart > windowMs) {
    bucket.count = 0;
    bucket.windowStart = now;
  }

  bucket.count += 1;
  u.rate[eventName] = bucket;

  if (bucket.count > maxCount) {
    log(`RATE LIMITED: ${socketId} on "${eventName}" (${bucket.count}/${maxCount})`);
    return true;
  }
  return false;
}

// #10 Cryptographically secure Fisher-Yates shuffle
function secureShuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// #5 Filter out socket IDs that no longer exist (disconnected but not yet cleaned up)
function pruneQueue() {
  for (const id of waitingQueue) {
    if (!io.sockets.sockets.get(id)) {
      waitingQueue.delete(id);
      users.delete(id);
    }
  }
}

// #2 Randomize, #4 never duplicate-pair, #9 avoid immediate rematch where possible
function tryMatch() {
  if (isMatching) return; // #11
  isMatching = true;

  try {
    pruneQueue();

    if (waitingQueue.size < 2) return;

    let pool = secureShuffle(Array.from(waitingQueue));

    while (pool.length >= 2) {
      const aId = pool.shift();
      const aUser = getUser(aId);
      const aSocket = io.sockets.sockets.get(aId);

      if (!aSocket || !aUser || aUser.state === UserState.MATCHED) {
        waitingQueue.delete(aId);
        continue;
      }

      // #9 Prefer a candidate that isn't a's last partner
      let bIndex = pool.findIndex((id) => {
        const bUser = getUser(id);
        const bSocket = io.sockets.sockets.get(id);
        return bSocket && bUser && bUser.state !== UserState.MATCHED && id !== aUser.lastPartnerId;
      });

      // Fallback: no "fresh" candidate available, take the first valid one anyway
      if (bIndex === -1) {
        bIndex = pool.findIndex((id) => {
          const bUser = getUser(id);
          const bSocket = io.sockets.sockets.get(id);
          return bSocket && bUser && bUser.state !== UserState.MATCHED;
        });
      }

      if (bIndex === -1) {
        // No valid partner left this pass; put a back and stop
        break;
      }

      const bId = pool.splice(bIndex, 1)[0];
      const bUser = getUser(bId);
      const bSocket = io.sockets.sockets.get(bId);

      // #4 Double-check neither is already paired (defensive, shouldn't happen)
      if (aUser.state === UserState.MATCHED || bUser.state === UserState.MATCHED) {
        continue;
      }

      waitingQueue.delete(aId);
      waitingQueue.delete(bId);

      const now = Date.now();
      if (aUser.joinedQueueAt) stats.totalWaitTimeMs += now - aUser.joinedQueueAt;
      if (bUser.joinedQueueAt) stats.totalWaitTimeMs += now - bUser.joinedQueueAt;
      stats.matchesMade += 1;

      aUser.state = UserState.MATCHED;
      bUser.state = UserState.MATCHED;
      aUser.partnerId = bId;
      bUser.partnerId = aId;
      aUser.lastPartnerId = bId;
      bUser.lastPartnerId = aId;
      aUser.joinedQueueAt = null;
      bUser.joinedQueueAt = null;

      aSocket.emit("matched", { partnerId: bId, initiator: true });
      bSocket.emit("matched", { partnerId: aId, initiator: false });
      emitStatus(aId, "matched");
      emitStatus(bId, "matched");

      // #7 Logging
      log(`Matched: ${aId} <-> ${bId} | queue size: ${waitingQueue.size} | total matches: ${stats.matchesMade}`);
    }
  } finally {
    isMatching = false;
  }
}

// #3 Auto-rematch: when a chat ends because a partner left (not because the
// user manually left), put the remaining user back into the queue.
function endChat(socketId, { requeue = false } = {}) {
  const u = ensureUser(socketId);
  const partnerId = u.partnerId;

  if (partnerId) {
    const partnerUser = getUser(partnerId);
    u.partnerId = null;
    if (partnerUser) partnerUser.partnerId = null;

    const partnerSocket = io.sockets.sockets.get(partnerId);
    if (partnerSocket && partnerUser) {
      partnerUser.state = UserState.WAITING;
      partnerUser.joinedQueueAt = Date.now();
      waitingQueue.add(partnerId); // #3 auto rematch for the other side
      partnerSocket.emit("partner-left");
      emitStatus(partnerId, "finding-another");
      log(`Partner left: ${partnerId}'s partner (${socketId}) disconnected/left. Requeued ${partnerId}.`);
    }
  }

  removeFromQueue(socketId);

  if (requeue) {
    u.state = UserState.WAITING;
    u.joinedQueueAt = Date.now();
    waitingQueue.add(socketId);
    emitStatus(socketId, "searching");
  } else {
    u.state = UserState.IDLE;
  }

  log(`Queue size: ${waitingQueue.size}`);
}

io.on("connection", (socket) => {
  ensureUser(socket.id);
  log("connected:", socket.id, "| active users:", users.size);

  socket.on("find-match", () => {
    if (isRateLimited(socket.id, "find-match", 5, 3000)) {
      emitStatus(socket.id, "rate-limited");
      return;
    }

    const u = ensureUser(socket.id);

    // #1 Prevent duplicate queue entries: if already waiting or matched,
    // clear that state first before re-adding.
    if (u.state === UserState.MATCHED) {
      endChat(socket.id);
    } else {
      removeFromQueue(socket.id);
    }

    u.state = UserState.WAITING;
    u.joinedQueueAt = Date.now();
    waitingQueue.add(socket.id); // Set dedupes automatically

    emitStatus(socket.id, "searching");
    log(`User joined queue: ${socket.id} | Queue size: ${waitingQueue.size}`);

    tryMatch();
  });

  // #15 Validate: only relay signaling data if sender is actually matched
  socket.on("signal", ({ data } = {}) => {
    if (isRateLimited(socket.id, "signal", 60, 5000)) return;

    const u = getUser(socket.id);
    if (!u || u.state !== UserState.MATCHED || !u.partnerId) {
      log(`Ignored "signal" from unmatched socket: ${socket.id}`);
      return;
    }
    io.to(u.partnerId).emit("signal", { data });
  });

  // #15 + #16 Validate + rate limit chat messages
  socket.on("chat-message", ({ text } = {}) => {
    if (isRateLimited(socket.id, "chat-message", 10, 3000)) {
      emitStatus(socket.id, "rate-limited");
      return;
    }

    const u = getUser(socket.id);
    if (!u || u.state !== UserState.MATCHED || !u.partnerId) {
      log(`Ignored "chat-message" from unmatched socket: ${socket.id}`);
      return;
    }
    if (typeof text !== "string" || text.length === 0 || text.length > 2000) return;

    io.to(u.partnerId).emit("chat-message", { text, fromSelf: false });
  });

  socket.on("leave-chat", () => {
    if (isRateLimited(socket.id, "leave-chat", 10, 3000)) return;
    endChat(socket.id);
    emitStatus(socket.id, "idle");
  });

  socket.on("disconnect", () => {
    log("disconnected:", socket.id);
    endChat(socket.id);
    users.delete(socket.id);
    log("active users:", users.size);
  });
});

// #14 Periodic stats logging
setInterval(() => {
  const avgWaitMs = stats.matchesMade > 0 ? Math.round(stats.totalWaitTimeMs / (stats.matchesMade * 2)) : 0;
  log(
    `STATS | active: ${users.size} | waiting: ${waitingQueue.size} | matches made: ${stats.matchesMade} | avg wait: ${avgWaitMs}ms`
  );
}, 30000);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => log(`Signaling server running on port ${PORT}`));