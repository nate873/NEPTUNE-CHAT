import { useEffect, useRef, useState } from "react";
import { socket } from "./socket";
import { supabase } from "./supabaseClient";

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
    setMessages((prev) => [...prev, { text: "Stranger disconnected.", system: true }]);
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    pendingSignalsRef.current = [];
    startSearch(); // automatically look for a new match
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
    startSearch();
  }

  function stopChat() {
    cleanupConnection();
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    socket.emit("leave-chat");
    setStatus("idle");
    setMessages([]);
  }

  function sendMessage() {
    if (!input.trim()) return;
    socket.emit("chat-message", { text: input });
    setMessages((prev) => [...prev, { text: input, fromSelf: true }]);
    setInput("");
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-600 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
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

          {userUniversity && (
            <span className="hidden sm:flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full pl-1.5 pr-3 py-1">
              <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0">
                <UniLogo school={userUniversity} size={14} />
              </span>
              <span className="text-white/80 text-xs font-semibold">
                {userUniversity.name}
              </span>
            </span>
          )}

          <div className="relative">
            <button
              onClick={() => setMenuOpen((open) => !open)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full pl-2 pr-3 py-1.5 transition"
            >
              <span className="w-7 h-7 rounded-full bg-yellow-400 text-indigo-900 font-bold flex items-center justify-center text-sm">
                {avatarLetter}
              </span>
              <span className="text-white text-sm max-w-[160px] truncate">
                {displayName}
              </span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-10">
                <div className="px-4 py-3 border-b border-white/10">
                  <p className="text-white/50 text-xs">Signed in as</p>
                  <p className="text-white text-sm truncate">{displayName}</p>
                  {displayName !== userEmail && (
                    <p className="text-white/40 text-xs truncate mt-0.5">
                      {userEmail}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-3 text-rose-400 hover:bg-white/5 transition text-sm font-medium"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main video area — big split screen like OmeTV */}
      <main className="flex-1 flex flex-col lg:flex-row gap-4 px-6 pb-4">
        <div className="relative flex-1 rounded-2xl overflow-hidden shadow-xl bg-slate-900 min-h-[45vh] lg:min-h-[70vh]">
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

        <div className="relative flex-1 rounded-2xl overflow-hidden shadow-xl bg-slate-900 min-h-[45vh] lg:min-h-[70vh] flex items-center justify-center">
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
                  <span className="w-3 h-3 rounded-full bg-violet-400 animate-ping" />
                  <p className="text-slate-300 font-medium">
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
      </main>

      {/* University filter — pick who you want to be matched with */}
      {status === "idle" && (
        <div className="flex justify-center pb-3 px-6">
          <UniversityFilterPicker
            open={filterOpen}
            setOpen={setFilterOpen}
            selected={universityFilter}
            onSelect={setUniversityFilter}
            selectedUniversity={selectedUniversity}
          />
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col items-center gap-2 pb-4">
        {status !== "idle" && (
          <span className="text-white/50 text-xs font-medium">
            {selectedUniversity ? (
              <span className="inline-flex items-center gap-1.5">
                <UniLogo school={selectedUniversity} size={16} />
                Matching with {selectedUniversity.name}
              </span>
            ) : (
              "Matching with all universities"
            )}
          </span>
        )}

        {status === "idle" && (
          <button
            onClick={startSearch}
            className="px-8 py-3 bg-yellow-400 text-indigo-900 font-bold rounded-full shadow-lg transition-all duration-200 hover:bg-yellow-300 hover:scale-105 hover:shadow-yellow-300/50 active:scale-95"
          >
            Start Chat
          </button>
        )}
        {status === "searching" && (
          <div className="flex gap-3">
            <button
              disabled
              className="px-8 py-3 bg-white/20 text-white font-semibold rounded-full shadow-inner cursor-not-allowed"
            >
              Searching...
            </button>
            <button
              onClick={stopChat}
              className="px-8 py-3 bg-white/10 border border-white/40 text-white font-semibold rounded-full transition-all duration-200 hover:bg-white/20 hover:scale-105 active:scale-95"
            >
              Stop
            </button>
          </div>
        )}
        {status === "connected" && (
          <div className="flex gap-3">
            <button
              onClick={nextOrLeave}
              className="px-8 py-3 bg-rose-500 text-white font-bold rounded-full shadow-lg transition-all duration-200 hover:bg-rose-400 hover:scale-105 hover:shadow-rose-400/50 active:scale-95"
            >
              Next ⏭
            </button>
            <button
              onClick={stopChat}
              className="px-8 py-3 bg-white/10 border border-white/40 text-white font-semibold rounded-full transition-all duration-200 hover:bg-white/20 hover:scale-105 active:scale-95"
            >
              Stop
            </button>
          </div>
        )}
      </div>

      {/* Chat log + input */}
      <div className="px-6 pb-6 max-w-4xl w-full mx-auto">
        <div className="w-full border border-white/20 rounded-xl p-3 h-40 overflow-y-auto bg-white/10 backdrop-blur shadow-inner">
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
                  ? "text-white/50 italic text-sm"
                  : m.fromSelf
                  ? "text-right text-yellow-300 font-medium"
                  : "text-left text-white"
              }
            >
              {m.fromSelf && !m.system ? `${displayName}: ` : ""}
              {m.text}
            </div>
          ))}
        </div>

        <div className="flex w-full gap-2 mt-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 border border-white/20 rounded-full px-4 py-2 bg-white/10 text-white placeholder-white/50 backdrop-blur focus:outline-none focus:ring-2 focus:ring-yellow-300"
          />
          <button
            onClick={sendMessage}
            className="px-6 py-2 bg-yellow-400 text-indigo-900 font-bold rounded-full transition-all duration-200 hover:bg-yellow-300 hover:scale-105 active:scale-95"
          >
            Send
          </button>
        </div>
      </div>
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
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-72 bg-slate-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-20">
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