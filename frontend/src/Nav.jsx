export default function Nav({ onHome, onAmbassadors, onGetStarted }) {
  return (
    <nav className="relative z-10 w-full px-6 md:px-10 py-4">
      <div className="flex items-center justify-between gap-6">
        {/* Logo — always goes home */}
        <button
          onClick={() => onHome && onHome()}
          className="flex items-center gap-2.5 shrink-0"
        >
          <NeptuneIcon size={44} />
          <span
            className="font-extrabold text-xl md:text-2xl tracking-tight whitespace-nowrap text-white"
            style={{
              filter:
                "drop-shadow(0 0 10px rgba(165,180,252,0.6)) drop-shadow(0 0 24px rgba(129,140,248,0.4))",
            }}
          >
            Neptune Chat
          </span>
        </button>

        {/* Center links — identical on every page */}
        <div className="hidden md:flex items-center gap-8">
          <button
            onClick={() => onHome && onHome()}
            className="text-white/70 text-sm font-semibold hover:text-white transition"
          >
            Video Chat
          </button>
          <button
            onClick={() => onAmbassadors && onAmbassadors()}
            className="text-white/70 text-sm font-semibold hover:text-white transition"
          >
            Ambassadors
          </button>
        </div>

        {/* Auth buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onGetStarted && onGetStarted("signin")}
            className="px-5 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm font-semibold transition-all duration-200 hover:bg-white/20 hover:scale-105 active:scale-95"
          >
            Log In
          </button>
          <button
            onClick={() => onGetStarted && onGetStarted("signup")}
            className="px-5 py-2 rounded-full bg-yellow-400 text-indigo-900 text-sm font-bold shadow-md transition-all duration-200 hover:bg-yellow-300 hover:scale-105 hover:shadow-yellow-300/50 hover:shadow-lg active:scale-95"
          >
            Sign Up
          </button>
        </div>
      </div>
    </nav>
  );
}

// Stands in for the planet Neptune — a blue/cyan gradient sphere with a
// tilted ring, given the same amber glow treatment as the rest of the
// site's icons so it reads as "lit up" rather than flat.
function NeptuneIcon({ size = 28 }) {
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
        <radialGradient id="neptuneBody" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="45%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </radialGradient>
      </defs>
      <ellipse cx="20" cy="26" rx="15" ry="4" fill="#ffffff" opacity="0.45" transform="rotate(-14 20 26)" />
      <circle cx="20" cy="19" r="12" fill="url(#neptuneBody)" />
      <path d="M9 15 Q20 19 31 14" stroke="#0c4a6e" strokeWidth="1.2" opacity="0.4" fill="none" />
      <path d="M8 22 Q20 26 32 21" stroke="#0c4a6e" strokeWidth="1" opacity="0.3" fill="none" />
    </svg>
  );
}