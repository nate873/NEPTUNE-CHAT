export default function Nav({ onHome, onAmbassadors, onGetStarted }) {
  return (
    <nav className="relative z-10 w-full px-6 md:px-10 py-4">
      <div className="flex items-center justify-between gap-6">
        {/* Logo — always goes home */}
        <button
          onClick={() => onHome && onHome()}
          className="flex items-center gap-2 shrink-0"
        >
          <span className="text-2xl">🔱</span>
          <span className="text-white font-bold text-lg tracking-tight whitespace-nowrap">
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