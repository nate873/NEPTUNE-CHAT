import { useEffect, useRef, useState, useMemo } from "react";
import { socket } from "./socket";
import { supabase } from "./supabaseClient";
import "./ChatRoom.css";

// TURN credentials from Metered (dashboard.metered.ca) — needed because
// STUN alone fails on restrictive networks / cellular NAT (this is why
// phone <-> computer connections were failing before).
const ICE_SERVERS = {
  iceServers: [
    {
      urls: "stun:stun.relay.metered.ca:80",
    },
    {
      urls: "turn:global.relay.metered.ca:80",
      username: "b1552fd424f7e06b925c5ab3",
      credential: "Bu5pCjH3iwxBIZ35",
    },
    {
      urls: "turn:global.relay.metered.ca:80?transport=tcp",
      username: "b1552fd424f7e06b925c5ab3",
      credential: "Bu5pCjH3iwxBIZ35",
    },
    {
      urls: "turn:global.relay.metered.ca:443",
      username: "b1552fd424f7e06b925c5ab3",
      credential: "Bu5pCjH3iwxBIZ35",
    },
    {
      urls: "turns:global.relay.metered.ca:443?transport=tcp",
      username: "b1552fd424f7e06b925c5ab3",
      credential: "Bu5pCjH3iwxBIZ35",
    },
  ],
};

// Same logo set used on the landing page conveyor belt — add/remove schools
// here and the filter picker below updates automatically.
const UNIVERSITIES = [
  { id: "ucf", name: "UCF", logo: "/logos/ucf.png" },
  { id: "msu", name: "Michigan State University", logo: "/logos/msu.png" },
  { id: "asu", name: "ASU", logo: "/logos/asu.png" },
  { id: "uf", name: "UF", logo: "/logos/uf.png" },
  { id: "fsu", name: "FSU", logo: "/logos/fsu.png" },
  { id: "fau", name: "FAU", logo: "/logos/fau.png" },
  { id: "uga", name: "University of Georgia", logo: "/logos/uga.png" },
  { id: "osu", name: "Ohio State", logo: "/logos/osu.png" },
  { id: "umiami", name: "University of Miami", logo: "/logos/umiami.png" },
  { id: "ucla", name: "UCLA", logo: "/logos/ucla.png" },
  { id: "usc", name: "USC", logo: "/logos/usc.png" },
];

// How long to wait for a same-school match before we widen the search to
// everyone. Tune this — shorter feels snappier, longer respects the filter
// choice more strictly.
const SCHOOL_MATCH_TIMEOUT_MS = 5000;

// ---------------------------------------------------------------------------
// Launch / nightly window gate — mirrors the same rule enforced server-side
// in server.js's `find-match` handler. This copy is for UI purposes only
// (showing the right screen/button state); the server is what actually
// blocks matching, so if these two ever drift apart the server wins.
// ---------------------------------------------------------------------------
const LAUNCH_AT = new Date("2026-09-06T20:00:00-04:00"); // Sept 6, 8:00 PM ET
const LIVE_START_HOUR_ET = 20; // 8 PM
const LIVE_END_HOUR_ET = 3; // 3 AM (next day) — window wraps past midnight

function isChatLive(now = new Date()) {
  if (now < LAUNCH_AT) return false;

  const etHour = parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour: "2-digit",
      hour12: false,
    }).format(now),
    10
  );

  // Window wraps past midnight (8 PM -> 3 AM), so "live" means either
  // "at or after 8 PM" OR "before 3 AM" — not a simple between-check.
  return etHour >= LIVE_START_HOUR_ET || etHour < LIVE_END_HOUR_ET;
}

// Small helper for the pre-launch message — formats the countdown target
// in a friendly way without pulling in a date library.
function formatLaunchLabel() {
  return LAUNCH_AT.toLocaleString("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export default function ChatRoom({ session }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingSignalsRef = useRef([]); // signals that arrive before pc exists
  const audioCtxRef = useRef(null); // lazy-created on first user gesture
  const toastTimeoutRef = useRef(null);
  const searchIntervalRef = useRef(null);

  // --- New: fallback-matching refs ---
  const fallbackTimerRef = useRef(null);
  const statusRef = useRef("idle"); // mirrors `status`, readable inside timeouts

  const [status, setStatus] = useState("idle"); // idle | searching | connected
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  // --- New: appeal/polish state ---
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [searchSeconds, setSearchSeconds] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [toast, setToast] = useState(null); // { message, tone }

  // --- New: partner identity for the current/most recent match ---
  const [partnerName, setPartnerName] = useState(null);

  // --- New: whether chat is currently allowed to start (launch gate) ---
  const [chatLive, setChatLive] = useState(() => isChatLive());

  const userEmail = session?.user?.email || "";
  // `username` is the current field (set at sign-up); `display_name` is
  // kept around for older accounts created before the username step
  // existed, so this still resolves sensibly for them.
  const username =
    session?.user?.user_metadata?.username ||
    session?.user?.user_metadata?.display_name ||
    userEmail;
  const avatarLetter = username.charAt(0).toUpperCase() || "?";
  // Short, stable-looking ID for the profile card, à la Monkey's "ID: 180546613"
  const shortId = session?.user?.id
    ? session.user.id.replace(/-/g, "").slice(0, 9).toUpperCase()
    : null;

  // Set at sign-up (EduAuth.jsx). Older accounts created before these steps
  // existed simply won't have them, and the badge/menu fall back gracefully.
  const userUniversityId = session?.user?.user_metadata?.university || null;
  const userUniversity = userUniversityId
    ? UNIVERSITIES.find((u) => u.id === userUniversityId) || null
    : null;
  const userMajor = session?.user?.user_metadata?.major || null;
  const userClassYear = session?.user?.user_metadata?.class_year || null;

  // "all" or a UNIVERSITIES[].id — which pool the user has *asked* to match
  // against. Defaults to the student's own school if they set one at sign-up.
  const [universityFilter, setUniversityFilter] = useState(
    userUniversityId || "all"
  );
  const [filterOpen, setFilterOpen] = useState(false);

  // --- New: what we're *actually* searching/matched against right now.
  // Usually mirrors universityFilter, but falls back to "all" (null) if no
  // one was available within SCHOOL_MATCH_TIMEOUT_MS. Kept separate so the
  // "Matching with ___" text reflects reality, not just the user's request.
  const [searchUniversityId, setSearchUniversityId] = useState(null);

  const selectedUniversity =
    universityFilter === "all"
      ? null
      : UNIVERSITIES.find((u) => u.id === universityFilter) || null;

  const searchUniversity = searchUniversityId
    ? UNIVERSITIES.find((u) => u.id === searchUniversityId) || null
    : null;

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  // --- New: toast helper — shows a brief message, auto-dismisses ---
  function showToast(message, tone = "info") {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, tone });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3200);
  }

  // --- New: tiny two-tone chime played on match, using Web Audio so no
  // audio file/asset is needed. Created lazily on first call (must follow
  // a user gesture, which "Start Chat" / matching always does). ---
  function playMatchChime() {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        audioCtxRef.current = new Ctx();
      }
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      [523.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, now + i * 0.11);
        gain.gain.linearRampToValueAtTime(0.12, now + i * 0.11 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.11 + 0.35);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.11);
        osc.stop(now + i * 0.11 + 0.4);
      });
    } catch (err) {
      // Audio isn't critical — fail silently if the browser blocks it.
      console.error("Could not play match chime", err);
    }
  }

  // Keep statusRef in sync so the fallback timeout (which fires well after
  // this render) can read the *current* status instead of a stale closure.
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // --- New: recheck the launch/window gate periodically so the screen
  // flips automatically at 8 PM ET without needing a page refresh. ---
  useEffect(() => {
    const interval = setInterval(() => {
      setChatLive(isChatLive());
    }, 15000); // recheck every 15s — cheap and responsive enough
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    socket.on("matched", handleMatched);
    socket.on("signal", handleSignal);
    socket.on("chat-message", handleChatMessage);
    socket.on("partner-left", handlePartnerLeft);
    // New: server-side rejection when find-match is called outside the
    // allowed window (belt-and-suspenders — the client-side chatLive check
    // above should normally prevent this from ever firing).
    socket.on("status", handleStatus);

    return () => {
      socket.off("matched", handleMatched);
      socket.off("signal", handleSignal);
      socket.off("chat-message", handleChatMessage);
      socket.off("partner-left", handlePartnerLeft);
      socket.off("status", handleStatus);
      cleanupConnection();
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- New: elapsed-time counter while searching, so it doesn't feel stuck ---
  useEffect(() => {
    if (status === "searching") {
      setSearchSeconds(0);
      searchIntervalRef.current = setInterval(() => {
        setSearchSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (searchIntervalRef.current) {
        clearInterval(searchIntervalRef.current);
        searchIntervalRef.current = null;
      }
    }
    return () => {
      if (searchIntervalRef.current) {
        clearInterval(searchIntervalRef.current);
        searchIntervalRef.current = null;
      }
    };
  }, [status]);

  async function getLocalStream() {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    setCameraReady(true);
    return stream;
  }

  function createPeerConnection() {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("signal", { data: { candidate: event.candidate } });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    return pc;
  }

  async function processSignal(pc, data) {
    if (data.sdp) {
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      if (data.sdp.type === "offer") {
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("signal", { data: { sdp: pc.localDescription } });
      }
    } else if (data.candidate) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (err) {
        console.error("Error adding ICE candidate", err);
      }
    }
  }

  // NOTE: for `partnerName` to actually populate, the server's "matched"
  // emit needs to include it, e.g.:
  //   socket.emit("matched", { initiator: true, partnerName: otherSocket.username });
  // Until then this safely falls back to "Stranger".
  async function handleMatched({ initiator, partnerName: incomingPartnerName }) {
    // A match happened — stop waiting for the same-school fallback timer.
    clearFallbackTimer();

    setStatus("connected");
    setMessages([]);
    setSessionCount((c) => c + 1);
    setPartnerName(incomingPartnerName || null);
    playMatchChime();
    showToast("You're connected!", "success");

    // Create the peer connection FIRST, synchronously, so incoming signals
    // are never dropped while we're still waiting on getUserMedia().
    const pc = createPeerConnection();
    pcRef.current = pc;

    // Flush any signals that arrived before pc existed.
    if (pendingSignalsRef.current.length) {
      const queued = pendingSignalsRef.current;
      pendingSignalsRef.current = [];
      for (const data of queued) {
        await processSignal(pc, data);
      }
    }

    const stream = await getLocalStream();
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    // Respect any mute/camera-off state the user had set before matching.
    stream.getAudioTracks().forEach((t) => (t.enabled = micOn));
    stream.getVideoTracks().forEach((t) => (t.enabled = camOn));

    if (initiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("signal", { data: { sdp: pc.localDescription } });
    }
  }

  async function handleSignal({ data }) {
    const pc = pcRef.current;
    if (!pc) {
      // Peer connection isn't ready yet — buffer it instead of dropping it.
      pendingSignalsRef.current.push(data);
      return;
    }
    await processSignal(pc, data);
  }

  function handleChatMessage({ text }) {
    setMessages((prev) => [...prev, { text, fromSelf: false }]);
  }

  function handlePartnerLeft() {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    pendingSignalsRef.current = [];
    setInput("");
    setPartnerName(null);
    showToast("Stranger disconnected — finding someone new...", "info");
    startSearch(); // automatically look for a new match — also clears messages
  }

  // --- New: handles the generic "status" channel from the server,
  // specifically the "chat-unavailable" case sent when find-match is
  // rejected because we're outside the launch/nightly window. ---
  function handleStatus({ status: statusName, message } = {}) {
    if (statusName === "chat-unavailable") {
      setChatLive(false);
      setStatus("idle");
      showToast(
        message || "Chat isn't live right now — check back during our nightly window.",
        "info"
      );
    }
  }

  function cleanupConnection() {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    pendingSignalsRef.current = [];
    setCameraReady(false);
  }

  // --- New: fallback-matching helpers ---
  function clearFallbackTimer() {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }

  // Kicks off (or restarts) the "widen to everyone" countdown. Only runs
  // when the user picked a specific school — "all" never needs a fallback.
  function armFallbackTimer(schoolId) {
    clearFallbackTimer();
    if (schoolId === "all") return;

    fallbackTimerRef.current = setTimeout(() => {
      // Only widen if we're still searching (not matched/cancelled since).
      if (statusRef.current !== "searching") return;

      const school = UNIVERSITIES.find((u) => u.id === schoolId);
      setSearchUniversityId(null); // "all" for display purposes
      socket.emit("find-match", { university: "all" });
      showToast(
        `No one from ${school ? school.name : "your school"} is online right now — matching you with everyone.`,
        "info"
      );
    }, SCHOOL_MATCH_TIMEOUT_MS);
  }

  async function startSearch() {
    // Client-side gate — mirrors the server's rule so people see a clear
    // message instead of a button that silently does nothing. The server
    // is the real enforcement point; this is just the UI shortcut.
    if (!isChatLive()) {
      setChatLive(false);
      showToast(
        `Neptune Chat launches ${formatLaunchLabel()}.`,
        "info"
      );
      return;
    }

    await getLocalStream();
    setStatus("searching");
    setMessages([]);
    setPartnerName(null);

    const requestedSchool = universityFilter; // "all" or a UNIVERSITIES[].id
    setSearchUniversityId(requestedSchool === "all" ? null : requestedSchool);

    // Server pairs sockets within the same `university` pool, or with
    // anyone when the value is "all". `username` is stored server-side and
    // sent back to whoever we match with as `partnerName`.
    socket.emit("find-match", { university: requestedSchool, username });

    // If nothing turns up within the school-specific pool in time, widen
    // the search to everyone rather than leaving the user stuck searching.
    armFallbackTimer(requestedSchool);
  }

  function nextOrLeave() {
    clearFallbackTimer();
    cleanupConnection();
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    socket.emit("leave-chat");
    setInput("");
    startSearch(); // clears messages too
  }

  function stopChat() {
    clearFallbackTimer();
    cleanupConnection();
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    socket.emit("leave-chat");
    setStatus("idle");
    setMessages([]);
    setInput("");
    setPartnerName(null);
    setSearchUniversityId(null);
  }

  function sendMessage() {
    if (status !== "connected") return; // can't message a stranger who isn't there
    if (!input.trim()) return;
    socket.emit("chat-message", { text: input });
    setMessages((prev) => [...prev, { text: input, fromSelf: true }]);
    setInput("");
  }

  // --- New: mic / camera toggles, applied live to the active stream ---
  function toggleMic() {
    setMicOn((prev) => {
      const next = !prev;
      localStreamRef.current
        ?.getAudioTracks()
        .forEach((t) => (t.enabled = next));
      return next;
    });
  }

  function toggleCam() {
    setCamOn((prev) => {
      const next = !prev;
      localStreamRef.current
        ?.getVideoTracks()
        .forEach((t) => (t.enabled = next));
      return next;
    });
  }

  // --- New: lightweight report action. No backend endpoint exists yet —
  // this emits a socket event (server can no-op or log it for now) and
  // immediately skips to a new match, same as pressing Next. ---
  function reportAndSkip() {
    socket.emit("report-user");
    showToast("Reported. Moving you to someone new.", "info");
    nextOrLeave();
  }

  return (
    <div
      className="chatroom-container h-screen w-full bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-600 flex flex-col overflow-hidden relative"
      style={{ zoom: 1.2 }}
    >
      {/* Marquee keyframes for the searching-screen logo conveyor, same
          animation the landing page uses. */}
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.15; transform: scale(0.85); }
          50% { opacity: 0.9; transform: scale(1.1); }
        }
        @keyframes floatSlow {
          0% { transform: translate(0px, 0px) rotate(var(--rot, 0deg)); }
          50% { transform: translate(var(--dx, 12px), var(--dy, -18px)) rotate(var(--rot, 0deg)); }
          100% { transform: translate(0px, 0px) rotate(var(--rot, 0deg)); }
        }
        @keyframes connectedPulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(52,211,153,0.5), 0 0 24px rgba(52,211,153,0.35); }
          50% { box-shadow: 0 0 0 4px rgba(52,211,153,0.7), 0 0 36px rgba(52,211,153,0.5); }
        }
      `}</style>

      {/* Scattered campus/Greek-life iconography — same texture as the rest of the site */}
      <ScatteredCrests />

      {/* Twinkling star field — same as the rest of the site */}
      <StarField />

      {/* Ambient drifting orbs — subtle background motion so the screen
          doesn't feel static while idle or searching. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="orb orb-a absolute -top-20 -left-20 w-80 h-80 rounded-full bg-yellow-300/10 blur-3xl" />
        <div className="orb orb-b absolute top-1/2 -right-24 w-96 h-96 rounded-full bg-cyan-300/10 blur-3xl" />
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          className={`toast fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full shadow-lg text-sm font-semibold backdrop-blur border ${
            toast.tone === "success"
              ? "bg-emerald-400/90 text-emerald-950 border-emerald-200/50"
              : "bg-slate-900/90 text-white border-white/10"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header className="relative shrink-0 flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2">
          <NeptuneIcon size={26} />
          <h1
            className="text-xl font-extrabold text-white tracking-tight"
            style={{ textShadow: "0 0 14px rgba(165,180,252,0.5)" }}
          >
            Neptune Chat
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {sessionCount > 0 && (
            <span className="hidden sm:inline text-white/60 text-xs font-medium">
              Chat #{sessionCount} today
            </span>
          )}

          {/* Sound toggle */}
          <button
            onClick={() => setSoundEnabled((s) => !s)}
            title={soundEnabled ? "Mute match chime" : "Unmute match chime"}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-sm transition-all duration-200 hover:scale-105"
          >
            {soundEnabled ? "🔊" : "🔇"}
          </button>

          {status === "connected" && (
            <span className="flex items-center gap-1.5 text-sm text-white font-medium">
              {/* Simple signal-bars icon, all bars lit = good connection */}
              <svg viewBox="0 0 20 14" className="w-4 h-3.5" fill="none">
                <rect x="0" y="9" width="3" height="5" rx="1" fill="#34d399" />
                <rect x="5.5" y="6" width="3" height="8" rx="1" fill="#34d399" />
                <rect x="11" y="3" width="3" height="11" rx="1" fill="#34d399" />
                <rect x="16.5" y="0" width="3" height="14" rx="1" fill="#34d399" />
              </svg>
              Connected
            </span>
          )}

          <div className="relative">
            <button
              onClick={() => setMenuOpen((open) => !open)}
              title={username}
              className={`w-9 h-9 rounded-full bg-yellow-400 text-indigo-900 font-bold flex items-center justify-center text-sm ring-2 transition-all duration-200 shadow-sm hover:scale-105 ${
                menuOpen ? "ring-yellow-300" : "ring-transparent"
              }`}
              style={{ boxShadow: "0 0 12px rgba(253,224,71,0.4)" }}
            >
              {avatarLetter}
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900/95 backdrop-blur border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-30">
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10">
                  <p className="text-white font-bold text-xs">My Profile</p>
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/70 text-sm leading-none transition-all duration-200 hover:bg-white/20 hover:text-white hover:scale-105 active:scale-95"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex items-center gap-2.5 px-3 py-3">
                  <span
                    className="w-11 h-11 rounded-full bg-yellow-400 text-indigo-900 font-bold flex items-center justify-center text-base ring-2 ring-yellow-300/60 shrink-0"
                    style={{ boxShadow: "0 0 14px rgba(253,224,71,0.4)" }}
                  >
                    {avatarLetter}
                  </span>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-sm truncate">@{username}</p>
                    {shortId && (
                      <p className="text-white/40 text-[10px] font-bold">ID: {shortId}</p>
                    )}
                  </div>
                </div>

                <div className="px-3 pb-3 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2.5 bg-white/5 rounded-lg px-2.5 py-2">
                    <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0">
                      {userUniversity ? (
                        <UniLogo school={userUniversity} size={14} />
                      ) : (
                        <span className="text-slate-700 text-xs">🌐</span>
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="text-white/40 text-[9px] uppercase tracking-wide font-bold">
                        University
                      </p>
                      <p className="text-white text-xs font-bold truncate">
                        {userUniversity ? userUniversity.name : "Not set"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-1.5">
                    <div className="flex-1 min-w-0 flex items-center gap-2 bg-white/5 rounded-lg px-2.5 py-2">
                      <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs shrink-0">
                        🎓
                      </span>
                      <div className="min-w-0">
                        <p className="text-white/40 text-[9px] uppercase tracking-wide font-bold">
                          Major
                        </p>
                        <p className="text-white text-xs font-bold truncate">
                          {userMajor || "Not set"}
                        </p>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 flex items-center gap-2 bg-white/5 rounded-lg px-2.5 py-2">
                      <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs shrink-0">
                        📆
                      </span>
                      <div className="min-w-0">
                        <p className="text-white/40 text-[9px] uppercase tracking-wide font-bold">
                          Year
                        </p>
                        <p className="text-white text-xs font-bold truncate">
                          {userClassYear || "Not set"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 bg-white/5 rounded-lg px-2.5 py-2">
                    <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs shrink-0">
                      ✉️
                    </span>
                    <div className="min-w-0">
                      <p className="text-white/40 text-[9px] uppercase tracking-wide font-bold">
                        Email
                      </p>
                      <p className="text-white text-xs font-bold truncate">
                        {userEmail}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sign out — same yellow pill treatment as the landing
                    page's primary CTA (Sign Up / Start Video Chat). */}
                <div className="px-3 pb-3 pt-0.5 border-t border-white/10">
                  <button
                    onClick={handleSignOut}
                    className="w-full px-5 py-2.5 rounded-full bg-yellow-400 text-indigo-900 text-sm font-bold shadow-md transition-all duration-200 hover:bg-yellow-300 hover:scale-105 hover:shadow-yellow-300/50 hover:shadow-lg active:scale-95"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Everything below fits in the remaining viewport height — no page scroll. */}
      <main className="relative flex-1 min-h-0 flex flex-col gap-2 px-6 pb-4">
        {/* Video row — local and remote boxes are the same size, side by side.
            Constrained to a max width/height so the boxes read a bit smaller
            than edge-to-edge, with breathing room around them. */}
        <div className="shrink-0 flex items-center justify-center">
          <div className="w-full max-w-7xl h-[50vh] flex flex-col lg:flex-row gap-4">
            <div
              className="video-box relative flex-1 min-h-0 rounded-3xl overflow-hidden bg-slate-900 border border-white/10 transition-all duration-300"
              style={
                status === "connected"
                  ? { animation: "connectedPulse 2.5s ease-in-out infinite" }
                  : { boxShadow: "0 20px 40px -12px rgba(0,0,0,0.5)" }
              }
            >
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Skeleton shown until the camera stream is actually ready */}
              {status !== "idle" && !cameraReady && (
                <div className="camera-skeleton absolute inset-0 flex items-center justify-center bg-slate-800">
                  <span className="text-slate-400 text-xs font-medium">
                    Loading camera...
                  </span>
                </div>
              )}

              {!camOn && cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                  <span className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-2xl">
                    {avatarLetter}
                  </span>
                </div>
              )}

              {/* Bigger, bolder name label */}
              <span className="absolute bottom-3 left-3 px-4 py-1.5 rounded-full bg-black/50 backdrop-blur text-white text-lg font-semibold max-w-[70%] truncate">
                @{username || "you"}
              </span>

              {/* Polished school badge — glass pill with major/year underneath */}
              {userUniversity && (
                <div className="absolute top-3 left-3 flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full bg-black/45 backdrop-blur border border-white/10">
                  <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0">
                    <UniLogo school={userUniversity} size={16} />
                  </span>
                  <div className="leading-tight">
                    <p className="text-white text-xs font-bold">
                      {userUniversity.name}
                    </p>
                    {(userMajor || userClassYear) && (
                      <p className="text-white/60 text-[10px] font-medium">
                        {[userClassYear, userMajor].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Mic / camera toggles — only useful once the camera is on */}
              {status !== "idle" && (
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <button
                    onClick={toggleMic}
                    title={micOn ? "Mute microphone" : "Unmute microphone"}
                    className={`cam-btn w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all duration-200 hover:scale-105 ${
                      micOn
                        ? "bg-white/15 hover:bg-white/25"
                        : "bg-rose-500/90 hover:bg-rose-500"
                    }`}
                  >
                    {micOn ? "🎤" : "🔇"}
                  </button>
                  <button
                    onClick={toggleCam}
                    title={camOn ? "Turn camera off" : "Turn camera on"}
                    className={`cam-btn w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all duration-200 hover:scale-105 ${
                      camOn
                        ? "bg-white/15 hover:bg-white/25"
                        : "bg-rose-500/90 hover:bg-rose-500"
                    }`}
                  >
                    {camOn ? "📹" : "🚫"}
                  </button>
                </div>
              )}
            </div>

            <div
              className="video-box relative flex-1 min-h-0 rounded-3xl overflow-hidden bg-slate-900 border border-white/10 flex items-center justify-center transition-all duration-300"
              style={
                status === "connected"
                  ? { animation: "connectedPulse 2.5s ease-in-out infinite" }
                  : { boxShadow: "0 20px 40px -12px rgba(0,0,0,0.5)" }
              }
            >
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* New: stranger's name label, mirrors the local video's label.
                  Only shown once connected — falls back to "Stranger" if the
                  server hasn't sent a partnerName yet. */}
              {status === "connected" && (
                <span className="absolute bottom-3 left-3 px-4 py-1.5 rounded-full bg-black/50 backdrop-blur text-white text-lg font-semibold max-w-[70%] truncate">
                  {partnerName ? `@${partnerName}` : "Stranger"}
                </span>
              )}

              {/* New: stranger's school, shown as a full-width banner across
                  the top of their video box (their own corner badge stays
                  small — this one is the "big" version for the other
                  person). Best-effort — reflects the pool the match came
                  from (searchUniversity), since we don't yet get the
                  partner's school/major/year explicitly from the server.
                  Only shown when that pool was a specific school, not "all". */}
              {status === "connected" && searchUniversity && (
                <div className="absolute top-0 left-0 right-0 flex items-center justify-center gap-2.5 py-3 bg-black/55 backdrop-blur-sm border-b border-white/10">
                  <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0">
                    <UniLogo school={searchUniversity} size={18} />
                  </span>
                  <span className="text-white text-lg font-bold tracking-tight">
                    {searchUniversity.name}
                  </span>
                </div>
              )}

              {status !== "connected" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/95 px-6">
                  {status === "searching" ? (
                    <>
                      <p className="searching-text">
                        Looking for someone to chat with...
                      </p>
                      <p className="text-slate-500 text-xs">
                        {searchUniversity
                          ? `Matching within ${searchUniversity.name}`
                          : "Matching across all universities"}
                      </p>

                      {/* Conveyor belt of school logos, same look/animation
                          as the landing page's LogoConveyor. */}
                      <SearchLogoConveyor />

                      <p className="text-slate-600 text-xs tabular-nums">
                        {searchSeconds}s
                      </p>
                    </>
                  ) : status === "idle" && !chatLive ? (
                    // --- New: pre-launch / outside-window message shown in
                    // place of "Stranger will appear here" ---
                    <div className="flex flex-col items-center gap-2 text-center">
                      <span className="text-3xl">🚀</span>
                      <p className="text-white font-bold text-lg">
                        We're not live yet
                      </p>
                      <p className="text-slate-400 text-sm max-w-xs">
                        Neptune Chat launches {formatLaunchLabel()}, then runs
                        nightly from 8 PM–3 AM ET.
                      </p>
                    </div>
                  ) : (
                    <p className="text-slate-400 font-medium">
                      Stranger will appear here
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Controls — compact row between the videos and the chat */}
        <div className="shrink-0 flex flex-col items-center gap-1.5">
          {status !== "idle" && (
            <span className="text-white/50 text-xs font-medium">
              {searchUniversity ? (
                <span className="inline-flex items-center gap-1.5">
                  <UniLogo school={searchUniversity} size={14} />
                  Matching with {searchUniversity.name}
                </span>
              ) : (
                "Matching with all universities"
              )}
            </span>
          )}

          {status === "idle" && chatLive && (
            /* Unified "start bar" — the school picker and Start Chat button
               now live inside one pill-shaped control bar instead of two
               separate floating pieces. Only shown once the launch/nightly
               window is actually open. */
            <div
              className="flex items-stretch bg-white/10 border border-white/20 rounded-full backdrop-blur"
              style={{ boxShadow: "0 8px 30px -8px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)" }}
            >
              <UniversityFilterPicker
                open={filterOpen}
                setOpen={setFilterOpen}
                selected={universityFilter}
                onSelect={setUniversityFilter}
                selectedUniversity={selectedUniversity}
              />
              <div className="w-px my-2.5 bg-white/20" />
              <button
                onClick={startSearch}
                className="start-btn px-10 py-3.5 m-1 bg-yellow-400 text-indigo-900 font-bold rounded-full text-lg transition-all duration-200 hover:bg-yellow-300 hover:scale-105 active:scale-95"
                style={{ boxShadow: "0 0 20px rgba(253,224,71,0.45)" }}
              >
                Start Chat
              </button>
            </div>
          )}

          {status === "idle" && !chatLive && (
            /* --- New: replaces the start bar entirely before launch / outside
               the nightly window. No button at all — nothing to click that
               would trigger a doomed find-match call. --- */
            <div
              className="flex flex-col items-center gap-1 px-8 py-3.5 bg-white/10 border border-white/20 rounded-full backdrop-blur text-center"
              style={{ boxShadow: "0 8px 30px -8px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)" }}
            >
              <span className="text-white font-bold text-sm">
                🔒 Chat opens {formatLaunchLabel()}
              </span>
              <span className="text-white/60 text-xs">
                Then live nightly, 8 PM–3 AM ET
              </span>
            </div>
          )}

          {status === "searching" && (
            <div className="flex gap-4">
              <button
                disabled
                className="px-10 py-3.5 bg-white/20 text-white font-semibold rounded-full shadow-inner cursor-not-allowed text-lg"
              >
                Searching...
              </button>
              <button
                onClick={stopChat}
                className="px-10 py-3.5 bg-white/10 border border-white/40 text-white font-semibold rounded-full transition-all duration-200 hover:bg-white/20 hover:scale-105 active:scale-95 text-lg"
              >
                Stop
              </button>
            </div>
          )}
          {status === "connected" && (
            <div className="flex gap-4">
              <button
                onClick={nextOrLeave}
                className="next-btn px-10 py-3.5 bg-rose-500 text-white font-bold rounded-full text-lg transition-all duration-200 hover:bg-rose-400 hover:scale-105 active:scale-95"
                style={{ boxShadow: "0 0 20px rgba(244,63,94,0.4)" }}
              >
                Next ⏭
              </button>
              <button
                onClick={stopChat}
                className="px-10 py-3.5 bg-white/10 border border-white/40 text-white font-semibold rounded-full transition-all duration-200 hover:bg-white/20 hover:scale-105 active:scale-95 text-lg"
              >
                Stop
              </button>
              <button
                onClick={reportAndSkip}
                title="Report this person and move on"
                className="px-6 py-3.5 bg-white/5 border border-white/20 text-white/70 hover:text-white hover:bg-white/10 font-semibold rounded-full transition-all duration-200 text-sm"
              >
                🚩 Report
              </button>
            </div>
          )}
        </div>

        {/* Chat log + input — a compact strip under the videos, small enough
            that the video boxes stay the focus of the screen. */}
        <div className="shrink-0 max-w-4xl w-full mx-auto flex flex-col gap-2">
          <div className="chat-log h-24 w-full border border-white/20 rounded-2xl p-3 overflow-y-auto bg-white/10 backdrop-blur shadow-inner">
            {messages.length === 0 && (
              <p className="text-white/50 text-sm italic">
                Messages will show up here...
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.system
                    ? "chat-bubble-system"
                    : m.fromSelf
                    ? "text-right chat-bubble-self font-medium"
                    : "text-left chat-bubble-other"
                }
              >
                {m.fromSelf && !m.system
                  ? `@${username}: `
                  : !m.system && !m.fromSelf
                  ? `${partnerName ? `@${partnerName}` : "Stranger"}: `
                  : ""}
                {m.text}
              </div>
            ))}
          </div>

          <div className="shrink-0 flex w-full gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              disabled={status !== "connected"}
              placeholder={
                status === "connected"
                  ? "Type a message..."
                  : "You'll be able to chat once you're matched..."
              }
              className="flex-1 min-w-0 border border-white/20 rounded-full px-4 py-2 bg-white/10 text-white placeholder-white/50 backdrop-blur focus:outline-none focus:ring-2 focus:ring-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={sendMessage}
              disabled={status !== "connected"}
              className="shrink-0 px-6 py-2 bg-yellow-400 text-indigo-900 font-bold rounded-full transition-all duration-200 hover:bg-yellow-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Send
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

// Stands in for the planet Neptune — a blue/cyan gradient sphere with a
// tilted white atmospheric band, matching the icon used in Nav.jsx and
// EduAuth.jsx so the same mark shows up everywhere in the product.
function NeptuneIcon({ size = 26 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      style={{
        filter:
          "drop-shadow(0 0 4px rgba(96,165,250,0.8)) drop-shadow(0 0 10px rgba(96,165,250,0.5))",
      }}
    >
      <defs>
        <radialGradient id="neptuneBodyChat" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="45%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </radialGradient>
      </defs>
      <ellipse cx="20" cy="26" rx="15" ry="4" fill="#ffffff" opacity="0.45" transform="rotate(-14 20 26)" />
      <circle cx="20" cy="19" r="12" fill="url(#neptuneBodyChat)" />
      <path d="M9 15 Q20 19 31 14" stroke="#0c4a6e" strokeWidth="1.2" opacity="0.4" fill="none" />
      <path d="M8 22 Q20 26 32 21" stroke="#0c4a6e" strokeWidth="1" opacity="0.3" fill="none" />
    </svg>
  );
}

// Same scattered campus/Greek-life iconography as the rest of the site.
const CAMPUS_ICONS = ["🎓", "Σ", "🏛️", "Δ", "📜", "Ω", "🎓", "Φ"];

function ScatteredCrests() {
  const placements = useMemo(() => {
    return [
      { top: "4%", left: "6%", rot: -12, size: "text-6xl", dx: 12, dy: -10, dur: 17 },
      { top: "6%", left: "30%", rot: 8, size: "text-4xl", dx: -10, dy: 10, dur: 14 },
      { top: "8%", left: "70%", rot: -10, size: "text-5xl", dx: -14, dy: -10, dur: 19 },
      { top: "5%", left: "92%", rot: 9, size: "text-5xl", dx: -12, dy: 12, dur: 16 },
      { top: "20%", left: "16%", rot: 10, size: "text-4xl", dx: 10, dy: 14, dur: 15 },
      { top: "22%", left: "50%", rot: -7, size: "text-4xl", dx: 8, dy: -12, dur: 13 },
      { top: "18%", left: "84%", rot: 7, size: "text-4xl", dx: -10, dy: 10, dur: 18 },
      { top: "38%", left: "4%", rot: 6, size: "text-4xl", dx: 8, dy: -14, dur: 14 },
      { top: "40%", left: "92%", rot: -10, size: "text-5xl", dx: -10, dy: 10, dur: 16 },
      { top: "58%", left: "10%", rot: -8, size: "text-4xl", dx: 10, dy: -10, dur: 15 },
      { top: "60%", left: "90%", rot: 12, size: "text-4xl", dx: -12, dy: 12, dur: 17 },
      { top: "76%", left: "14%", rot: -8, size: "text-5xl", dx: 10, dy: -12, dur: 20 },
      { top: "74%", left: "48%", rot: 6, size: "text-3xl", dx: -8, dy: 10, dur: 12 },
      { top: "80%", left: "82%", rot: 9, size: "text-5xl", dx: -12, dy: 12, dur: 18 },
      { top: "92%", left: "24%", rot: 5, size: "text-4xl", dx: 10, dy: 10, dur: 13 },
      { top: "94%", left: "60%", rot: -6, size: "text-4xl", dx: -10, dy: -10, dur: 15 },
    ];
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      {placements.map((p, i) => (
        <span
          key={i}
          className={`absolute font-extrabold text-yellow-100 ${p.size}`}
          style={{
            top: p.top,
            left: p.left,
            "--rot": `${p.rot}deg`,
            "--dx": `${p.dx}px`,
            "--dy": `${p.dy}px`,
            transform: `rotate(${p.rot}deg)`,
            animation: `floatSlow ${p.dur}s ease-in-out infinite`,
            opacity: 0.6,
            filter:
              "drop-shadow(0 0 8px rgba(253,224,71,0.6)) drop-shadow(0 0 20px rgba(253,224,71,0.35))",
          }}
        >
          {CAMPUS_ICONS[i % CAMPUS_ICONS.length]}
        </span>
      ))}
    </div>
  );
}

// Same twinkling star field as the rest of the site.
function StarField() {
  const stars = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 40; i++) {
      arr.push({
        top: `${(i * 23 + (i % 5) * 11) % 100}%`,
        left: `${(i * 41 + (i % 7) * 9) % 100}%`,
        delay: `${(i % 9) * 0.35}s`,
        duration: `${2.5 + (i % 5)}s`,
        driftDur: `${9 + (i % 6) * 2}s`,
        dx: `${((i % 5) - 2) * 6}px`,
        dy: `${((i % 4) - 2) * 8}px`,
        size: i % 5 === 0 ? "w-2 h-2" : i % 3 === 0 ? "w-1.5 h-1.5" : "w-1 h-1",
      });
    }
    return arr;
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute"
          style={{
            top: s.top,
            left: s.left,
            "--dx": s.dx,
            "--dy": s.dy,
            animation: `floatSlow ${s.driftDur} ease-in-out infinite`,
          }}
        >
          <span
            className={`block rounded-full bg-white ${s.size}`}
            style={{
              animation: `twinkle ${s.duration} ease-in-out ${s.delay} infinite`,
            }}
          />
        </span>
      ))}
    </div>
  );
}

// Dropdown that lets the user pick "All Universities" or one school to
// match within. Uses the same logo files as the landing page belt.
// Styled "flush" so it drops into the unified start bar (no own
// background/border — the parent bar supplies both).
function UniversityFilterPicker({ open, setOpen, selected, onSelect, selectedUniversity }) {
  return (
    <div className="relative h-full">
      <button
        onClick={() => setOpen((o) => !o)}
        className="h-full flex items-center gap-2 hover:bg-white/10 rounded-full pl-5 pr-4 py-3 transition-all duration-200"
      >
        {selectedUniversity ? (
          <>
            <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0">
              <UniLogo school={selectedUniversity} size={18} />
            </span>
            <span className="text-white text-base font-medium">
              {selectedUniversity.name}
            </span>
          </>
        ) : (
          <>
            <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm shrink-0">
              🌐
            </span>
            <span className="text-white text-base font-medium">
              All Universities
            </span>
          </>
        )}
        <span
          className={`text-white/60 text-sm transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-0 w-72 bg-slate-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-30">
          <div className="px-4 py-2.5 border-b border-white/10">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-wide">
              Match with
            </p>
          </div>

          <div className="max-h-72 overflow-y-auto">
            <button
              onClick={() => {
                onSelect("all");
                setOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-150 ${
                selected === "all" ? "bg-yellow-400/10" : "hover:bg-white/5"
              }`}
            >
              <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-sm shrink-0">
                🌐
              </span>
              <span
                className={`text-sm font-medium ${
                  selected === "all" ? "text-yellow-300" : "text-white"
                }`}
              >
                All Universities
              </span>
            </button>

            {UNIVERSITIES.map((school) => (
              <button
                key={school.id}
                onClick={() => {
                  onSelect(school.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-150 ${
                  selected === school.id ? "bg-yellow-400/10" : "hover:bg-white/5"
                }`}
              >
                <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0">
                  <UniLogo school={school} size={18} />
                </span>
                <span
                  className={`text-sm font-medium truncate ${
                    selected === school.id ? "text-yellow-300" : "text-white"
                  }`}
                >
                  {school.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Small looping strip of school logos shown on the "searching" screen —
// same marquee technique as the landing page's LogoConveyor, just sized
// down to fit inside the remote video box.
function SearchLogoConveyor() {
  const track = [...UNIVERSITIES, ...UNIVERSITIES];

  return (
    <div className="w-full max-w-sm overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
      <div className="flex w-max items-center gap-4 [animation:marquee_16s_linear_infinite]">
        {track.map((school, i) => (
          <div
            key={i}
            className="shrink-0 w-16 h-16 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-md"
            title={school.name}
          >
            <UniLogo school={school} size={38} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Renders a school logo, falling back to its initials if the image fails
// to load (e.g. a filename typo or a file not yet added to public/logos).
function UniLogo({ school, size = 20 }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className="text-slate-700 font-bold"
        style={{ fontSize: Math.max(9, size * 0.45) }}
      >
        {school.name.charAt(0)}
      </span>
    );
  }

  return (
    <img
      src={school.logo}
      alt={school.name}
      onError={() => setFailed(true)}
      style={{ width: size, height: size }}
      className="object-contain"
    />
  );
}