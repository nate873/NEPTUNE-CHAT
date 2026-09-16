export default function Nav({ onHome, onAmbassadors, onGetStarted }) {
  const scrollToSection = (id) => {
    const element = document.getElementById(id);

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <nav
      className="relative z-30 w-full px-4 sm:px-6 md:px-10 py-4"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-between gap-5">
        {/* Logo */}
        <button
          type="button"
          onClick={() => onHome && onHome()}
          className="flex items-center gap-2.5 shrink-0 group"
          aria-label="Neptune Chat home"
        >
          <NeptuneIcon size={44} />

          <span
            className="font-extrabold text-lg md:text-2xl tracking-tight whitespace-nowrap text-white"
            style={{
              filter:
                "drop-shadow(0 0 10px rgba(165,180,252,0.6)) drop-shadow(0 0 24px rgba(129,140,248,0.4))",
            }}
          >
            Neptune Chat
          </span>
        </button>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-7">
          {/* Homepage */}
          <button
            type="button"
            onClick={() => onHome && onHome()}
            className="nav-link"
          >
            Video Chat
          </button>

          {/* Homepage section */}
          <button
            type="button"
            onClick={() => scrollToSection("how-it-works")}
            className="nav-link"
          >
            How It Works
          </button>

          {/* Explore Dropdown */}
          <div className="relative group">
            <button
              type="button"
              className="nav-link flex items-center gap-1.5"
            >
              Explore

              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Dropdown */}
            <div
              className="
                absolute
                top-full
                left-1/2
                -translate-x-1/2
                pt-4
                opacity-0
                invisible
                translate-y-2
                group-hover:opacity-100
                group-hover:visible
                group-hover:translate-y-0
                transition-all
                duration-200
              "
            >
              <div
                className="
                  w-64
                  rounded-2xl
                  bg-indigo-950/95
                  border
                  border-white/15
                  backdrop-blur-xl
                  shadow-2xl
                  p-2
                "
              >
                <DropdownLink
                  href="/college-video-chat"
                  title="College Video Chat"
                  description="Random video chat built for college students."
                />

                <DropdownLink
                  href="/omegle-alternative"
                  title="Omegle Alternative"
                  description="A college-focused alternative to open random chat."
                />

                <DropdownLink
                  href="/universities"
                  title="Universities"
                  description="Discover Neptune Chat across college campuses."
                />

                <DropdownLink
                  href="/safety"
                  title="Safety"
                  description="Learn about privacy and community safety."
                />

                <DropdownLink
                  href="/faq"
                  title="FAQ"
                  description="Answers to common Neptune Chat questions."
                />
              </div>
            </div>
          </div>

          {/* Ambassador page */}
          <button
            type="button"
            onClick={() => onAmbassadors && onAmbassadors()}
            className="nav-link"
          >
            Ambassadors
          </button>
        </div>

        {/* Authentication */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onGetStarted && onGetStarted("signin")}
            className="
              px-4
              sm:px-5
              py-2
              rounded-full
              bg-white/10
              border
              border-white/20
              text-white
              text-xs
              sm:text-sm
              font-semibold
              transition-all
              duration-200
              hover:bg-white/20
              hover:scale-105
              active:scale-95
            "
          >
            Log In
          </button>

          <button
            type="button"
            onClick={() => onGetStarted && onGetStarted("signup")}
            className="
              px-4
              sm:px-5
              py-2
              rounded-full
              bg-yellow-400
              text-indigo-900
              text-xs
              sm:text-sm
              font-extrabold
              transition-all
              duration-200
              hover:bg-yellow-300
              hover:scale-105
              active:scale-95
            "
            style={{
              boxShadow:
                "0 0 18px rgba(253,224,71,0.35)",
            }}
          >
            Sign Up
          </button>
        </div>
      </div>

      {/* Mobile SEO Links */}
      <div className="lg:hidden mt-4 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-2 min-w-max pb-1">
          <a href="/college-video-chat" className="mobile-nav-link">
            College Video Chat
          </a>

          <a href="/omegle-alternative" className="mobile-nav-link">
            Omegle Alternative
          </a>

          <a href="/universities" className="mobile-nav-link">
            Universities
          </a>

          <a href="/safety" className="mobile-nav-link">
            Safety
          </a>

          <a href="/faq" className="mobile-nav-link">
            FAQ
          </a>
        </div>
      </div>

      <style>{`
        .nav-link {
          position: relative;
          color: rgba(255,255,255,0.72);
          font-size: 0.875rem;
          font-weight: 650;
          white-space: nowrap;
          transition: color 180ms ease, transform 180ms ease;
        }

        .nav-link:hover {
          color: white;
          transform: translateY(-1px);
        }

        .nav-link::after {
          content: "";
          position: absolute;
          left: 50%;
          bottom: -7px;
          width: 0;
          height: 2px;
          border-radius: 999px;
          background: #fde047;
          transform: translateX(-50%);
          box-shadow: 0 0 8px rgba(253,224,71,0.7);
          transition: width 180ms ease;
        }

        .nav-link:hover::after {
          width: 70%;
        }

        .mobile-nav-link {
          padding: 0.5rem 1rem;
          border-radius: 999px;
          background: rgba(0,0,0,0.15);
          border: 1px solid rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.78);
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
          transition: all 180ms ease;
        }

        .mobile-nav-link:hover {
          color: white;
          background: rgba(255,255,255,0.15);
          border-color: rgba(255,255,255,0.25);
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </nav>
  );
}

function DropdownLink({ href, title, description }) {
  return (
    <a
      href={href}
      className="
        block
        rounded-xl
        px-4
        py-3
        transition-all
        duration-200
        hover:bg-white/10
        group/link
      "
    >
      <span className="block text-white font-bold text-sm group-hover/link:text-yellow-300 transition-colors">
        {title}
      </span>

      <span className="block mt-1 text-white/50 text-xs leading-relaxed">
        {description}
      </span>
    </a>
  );
}

function NeptuneIcon({ size = 28 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      role="img"
      aria-label="Neptune Chat logo"
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

      <ellipse
        cx="20"
        cy="26"
        rx="15"
        ry="4"
        fill="#ffffff"
        opacity="0.45"
        transform="rotate(-14 20 26)"
      />

      <circle
        cx="20"
        cy="19"
        r="12"
        fill="url(#neptuneBody)"
      />

      <path
        d="M9 15 Q20 19 31 14"
        stroke="#0c4a6e"
        strokeWidth="1.2"
        opacity="0.4"
        fill="none"
      />

      <path
        d="M8 22 Q20 26 32 21"
        stroke="#0c4a6e"
        strokeWidth="1"
        opacity="0.3"
        fill="none"
      />
    </svg>
  );
}