const express = require("express");
const http = require("http");
const cors = require("cors");
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
});

// Users waiting to be matched
let waitingQueue = [];
// Map of socket.id -> partner socket.id
let activePairs = new Map();

function removeFromQueue(socketId) {
  waitingQueue = waitingQueue.filter((id) => id !== socketId);
}

function tryMatch() {
  while (waitingQueue.length >= 2) {
    const a = waitingQueue.shift();
    const b = waitingQueue.shift();

    const socketA = io.sockets.sockets.get(a);
    const socketB = io.sockets.sockets.get(b);

    if (!socketA || !socketB) continue; // one disconnected, skip

    activePairs.set(a, b);
    activePairs.set(b, a);

    socketA.emit("matched", { partnerId: b, initiator: true });
    socketB.emit("matched", { partnerId: a, initiator: false });
  }
}

function endChat(socketId) {
  const partnerId = activePairs.get(socketId);
  if (partnerId) {
    activePairs.delete(socketId);
    activePairs.delete(partnerId);
    const partnerSocket = io.sockets.sockets.get(partnerId);
    if (partnerSocket) partnerSocket.emit("partner-left");
  }
  removeFromQueue(socketId);
}

io.on("connection", (socket) => {
  console.log("connected:", socket.id);

  socket.on("find-match", () => {
    endChat(socket.id); // clear any previous pairing
    waitingQueue.push(socket.id);
    tryMatch();
  });

  // Relay WebRTC signaling data (offer/answer/ICE) to the paired partner
  socket.on("signal", ({ data }) => {
    const partnerId = activePairs.get(socket.id);
    if (partnerId) {
      io.to(partnerId).emit("signal", { data });
    }
  });

  socket.on("chat-message", ({ text }) => {
    const partnerId = activePairs.get(socket.id);
    if (partnerId) {
      io.to(partnerId).emit("chat-message", { text, fromSelf: false });
    }
  });

  socket.on("leave-chat", () => {
    endChat(socket.id);
  });

  socket.on("disconnect", () => {
    console.log("disconnected:", socket.id);
    endChat(socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Signaling server running on port ${PORT}`));