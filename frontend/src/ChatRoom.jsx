import { useEffect, useRef, useState } from "react";
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

export default function ChatRoom({ session }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingSignalsRef = useRef([]); // signals that arrive before pc exists

  const [status, setStatus] = useState("idle"); // idle | searching | connected
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const userEmail = session?.user?.email || "";
  const displayName = session?.user?.user_metadata?.display_name || userEmail;
  const avatarLetter = displayName.charAt(0).toUpperCase() || "?";
  // Short, stable-looking ID for the profile card, à la Monkey's "ID: 180546613"
  const shortId = session?.user?.id
    ? session.user.id.replace(/-/g, "").slice(0, 9).toUpperCase()
    : null;

  // Set at sign-up (EduAuth.jsx). Older accounts created before that step
  // existed simply won't have this, and the badge/filter fall back to "all".
  const userUniversityId = session?.user?.user_metadata?.university || null;
  const userUniversity = userUniversityId
    ? UNIVERSITIES.find((u) => u.id === userUniversityId) || null
    : null;

  // "all" or a UNIVERSITIES[].id — which pool of students to match against.
  // Defaults to the student's own school if they set one at sign-up.
  const [universityFilter, setUniversityFilter] = useState(
    userUniversityId || "all"
  );
  const [filterOpen, setFilterOpen] = useState(false);

  const selectedUniversity =
    universityFilter === "all"
      ? null
      : UNIVERSITIES.find((u) => u.id === universityFilter) || null;

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  useEffect(() => {
    socket.on("matched", handleMatched);
    socket.on("signal", handleSignal);
    socket.on("chat-message", handleChatMessage);
    socket.on("partner-left", handlePartnerLeft);

    return () => {
      socket.off("matched", handleMatched);
      socket.off("signal", handleSignal);
      socket.off("chat-message", handleChatMessage);
      socket.off("partner-left", handlePartnerLeft);
      cleanupConnection();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function getLocalStream() {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
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

  async function handleMatched({ initiator }) {
    setStatus("connected");
    setMessages([]);

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
    startSearch(); // automatically look for a new match — also clears messages
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
  }

  async function startSearch() {
    await getLocalStream();
    setStatus("searching");
    setMessages([]);
    // Server should use `university` to only pair sockets in the same pool,
    // or ignore it / pair from everyone when the value is "all".
    socket.emit("find-match", { university: universityFilter });
  }

  function nextOrLeave() {
    cleanupConnection();
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    socket.emit("leave-chat");
    setInput("");
    startSearch(); // clears messages too
  }

  function stopChat() {
    cleanupConnection();
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    socket.emit("leave-chat");
    setStatus("idle");
    setMessages([]);
    setInput("");
  }

  function sendMessage() {
    if (status !== "connected") return; // can't message a stranger who isn't there
    if (!input.trim()) return;
    socket.emit("chat-message", { text: input });
    setMessages((prev) => [...prev, { text: input, fromSelf: true }]);
    setInput("");
  }

  return (
    <div className="chatroom-container h-screen w-full bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-600 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-6 py-3">
        <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow">
          🔱 Neptune Chat
        </h1>

        <div className="flex items-center gap-4">
          {status === "connected" && (
            <span className="flex items-center gap-2 text-sm text-white font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Connected
            </span>
          )}

          <div className="relative">
            <button
              onClick={() => setMenuOpen((open) => !open)}
              className={`flex items-center gap-2 border rounded-full pl-1.5 pr-3 py-1 transition shadow-sm ${
                menuOpen
                  ? "bg-white/20 border-yellow-300/60"
                  : "bg-white/10 border-white/20 hover:bg-white/20"
              }`}
            >
              <span
                className={`w-7 h-7 rounded-full bg-yellow-400 text-indigo-900 font-bold flex items-center justify-center text-sm ring-2 transition ${
                  menuOpen ? "ring-yellow-300" : "ring-transparent"
                }`}
              >
                {avatarLetter}
              </span>
              <span className="text-white text-sm max-w-[160px] truncate font-medium">
                {displayName}
              </span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-30">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                  <p className="text-white font-semibold text-sm">My Profile</p>
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="text-white/40 hover:text-white text-lg leading-none transition"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex items-center gap-3 px-4 py-4">
                  <span className="w-14 h-14 rounded-full bg-yellow-400 text-indigo-900 font-bold flex items-center justify-center text-xl ring-2 ring-yellow-300/60 shrink-0">
                    {avatarLetter}
                  </span>
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">{displayName}</p>
                    {shortId && (
                      <p className="text-white/40 text-xs">ID: {shortId}</p>
                    )}
                  </div>
                </div>

                <div className="px-4 pb-4 flex flex-col gap-2">
                  <div className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2.5">
                    <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0">
                      {userUniversity ? (
                        <UniLogo school={userUniversity} size={18} />
                      ) : (
                        <span className="text-slate-700 text-sm">🌐</span>
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="text-white/40 text-[10px] uppercase tracking-wide font-semibold">
                        University
                      </p>
                      <p className="text-white text-sm font-medium truncate">
                        {userUniversity ? userUniversity.name : "Not set"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2.5">
                    <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm shrink-0">
                      ✉️
                    </span>
                    <div className="min-w-0">
                      <p className="text-white/40 text-[10px] uppercase tracking-wide font-semibold">
                        Email
                      </p>
                      <p className="text-white text-sm font-medium truncate">
                        {userEmail}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  className="w-full text-center px-4 py-3 border-t border-white/10 text-rose-400 hover:bg-white/5 transition text-sm font-semibold"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Everything below fits in the remaining viewport height — no page scroll. */}
      <main className="flex-1 min-h-0 flex flex-col gap-3 px-6 pb-4">
        {/* Video row — local and remote boxes are the same size, side by side */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4">
          <div className="video-box relative flex-1 min-h-0 rounded-2xl overflow-hidden shadow-xl bg-slate-900">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/50 text-white text-xs font-medium max-w-[70%] truncate">
              {displayName || "You"}
            </span>
          </div>

          <div className="video-box relative flex-1 min-h-0 rounded-2xl overflow-hidden shadow-xl bg-slate-900 flex items-center justify-center">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {status !== "connected" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/95">
                {status === "searching" ? (
                  <>
                    <p className="searching-text">
                      Looking for someone to chat with...
                    </p>
                    <p className="text-slate-500 text-xs">
                      {selectedUniversity
                        ? `Matching within ${selectedUniversity.name}`
                        : "Matching across all universities"}
                    </p>
                  </>
                ) : (
                  <p className="text-slate-400 font-medium">
                    Stranger will appear here
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Controls — compact row between the videos and the chat */}
        <div className="shrink-0 flex flex-col items-center gap-1.5">
          {status !== "idle" && (
            <span className="text-white/50 text-xs font-medium">
              {selectedUniversity ? (
                <span className="inline-flex items-center gap-1.5">
                  <UniLogo school={selectedUniversity} size={14} />
                  Matching with {selectedUniversity.name}
                </span>
              ) : (
                "Matching with all universities"
              )}
            </span>
          )}

          {status === "idle" && (
            <div className="flex items-center gap-3">
              <UniversityFilterPicker
                open={filterOpen}
                setOpen={setFilterOpen}
                selected={universityFilter}
                onSelect={setUniversityFilter}
                selectedUniversity={selectedUniversity}
              />
              <button
                onClick={startSearch}
                className="start-btn px-6 py-2 bg-yellow-400 text-indigo-900 font-bold rounded-full shadow-lg text-sm"
              >
                Start Chat
              </button>
            </div>
          )}
          {status === "searching" && (
            <div className="flex gap-3">
              <button
                disabled
                className="px-6 py-2 bg-white/20 text-white font-semibold rounded-full shadow-inner cursor-not-allowed text-sm"
              >
                Searching...
              </button>
              <button
                onClick={stopChat}
                className="px-6 py-2 bg-white/10 border border-white/40 text-white font-semibold rounded-full transition-all duration-200 hover:bg-white/20 hover:scale-105 active:scale-95 text-sm"
              >
                Stop
              </button>
            </div>
          )}
          {status === "connected" && (
            <div className="flex gap-3">
              <button
                onClick={nextOrLeave}
                className="next-btn px-6 py-2 bg-rose-500 text-white font-bold rounded-full shadow-lg text-sm"
              >
                Next ⏭
              </button>
              <button
                onClick={stopChat}
                className="px-6 py-2 bg-white/10 border border-white/40 text-white font-semibold rounded-full transition-all duration-200 hover:bg-white/20 hover:scale-105 active:scale-95 text-sm"
              >
                Stop
              </button>
            </div>
          )}
        </div>

        {/* Chat log + input — a compact strip under the videos, small enough
            that the video boxes stay the focus of the screen. */}
        <div className="shrink-0 max-w-4xl w-full mx-auto flex flex-col gap-2">
          <div className="chat-log h-24 w-full border border-white/20 rounded-xl p-3 overflow-y-auto bg-white/10 backdrop-blur shadow-inner">
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
                {m.fromSelf && !m.system ? `${displayName}: ` : ""}
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

// Dropdown that lets the user pick "All Universities" or one school to
// match within. Uses the same logo files as the landing page belt.
function UniversityFilterPicker({ open, setOpen, selected, onSelect, selectedUniversity }) {
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full pl-2 pr-4 py-1.5 transition-all duration-200"
      >
        {selectedUniversity ? (
          <>
            <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0">
              <UniLogo school={selectedUniversity} size={16} />
            </span>
            <span className="text-white text-sm font-medium">
              {selectedUniversity.name}
            </span>
          </>
        ) : (
          <>
            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs shrink-0">
              🌐
            </span>
            <span className="text-white text-sm font-medium">
              All Universities
            </span>
          </>
        )}
        <span
          className={`text-white/60 text-xs transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-72 bg-slate-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-30">
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