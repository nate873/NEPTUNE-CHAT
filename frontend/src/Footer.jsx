export default function Footer({
  onHome,
  onAmbassadors,
  onGetStarted,
}) {
  const goHome = () => {
    if (onHome) {
      onHome();
      return;
    }

    window.location.href = "/";
  };

  const goToHomeSection = (section) => {
    // If we're already on the homepage, smoothly scroll.
    if (window.location.pathname === "/") {
      const element = document.getElementById(section);

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

        return;
      }
    }

    // Otherwise return to homepage + anchor.
    window.location.href = `/#${section}`;
  };

  return (
    <footer
      className="
        relative
        z-10
        border-t
        border-white/10
        bg-black/15
        backdrop-blur
      "
      aria-label="Neptune Chat footer"
    >
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-8">
        {/* Main footer grid */}
        <div
          className="
            grid
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-[1.5fr_1fr_1fr_1fr]
            gap-10
          "
        >
          {/* ================================================= */}
          {/* BRAND */}
          {/* ================================================= */}

          <div>
            <button
              type="button"
              onClick={goHome}
              className="flex items-center gap-2.5 group"
              aria-label="Go to Neptune Chat homepage"
            >
              <NeptuneIcon size={38} />

              <span
                className="
                  text-white
                  text-xl
                  font-extrabold
                  tracking-tight
                  group-hover:text-yellow-300
                  transition-colors
                "
                style={{
                  textShadow:
                    "0 0 14px rgba(165,180,252,0.35)",
                }}
              >
                Neptune Chat
              </span>
            </button>

            <p className="mt-4 max-w-sm text-white/55 text-sm leading-relaxed">
              Random video and text chat built for college students.
              Meet verified students through spontaneous one-on-one
              conversations.
            </p>

            <p className="mt-3 text-white/40 text-xs">
              Live nightly from 8 PM–3 AM ET.
            </p>

            {/* CTA */}
            <button
              type="button"
              onClick={() =>
                onGetStarted && onGetStarted("signup")
              }
              className="
                mt-5
                inline-flex
                items-center
                gap-2
                px-5
                py-2.5
                rounded-full
                bg-yellow-400
                text-indigo-950
                text-sm
                font-extrabold
                transition-all
                duration-200
                hover:bg-yellow-300
                hover:scale-105
                active:scale-95
              "
              style={{
                boxShadow:
                  "0 0 16px rgba(253,224,71,0.25)",
              }}
            >
              Join Neptune Chat
              <span>→</span>
            </button>
          </div>

          {/* ================================================= */}
          {/* EXPLORE */}
          {/* ================================================= */}

          <FooterColumn title="Explore">
            <FooterLink href="/omegle-alternative">
              Omegle Alternative
            </FooterLink>

            {/*
              Add this back once /college-video-chat exists:

              <FooterLink href="/college-video-chat">
                College Video Chat
              </FooterLink>
            */}

            <FooterButton
              onClick={() =>
                goToHomeSection("how-it-works")
              }
            >
              How It Works
            </FooterButton>

            <FooterButton
              onClick={() =>
                goToHomeSection("faq")
              }
            >
              FAQ
            </FooterButton>
          </FooterColumn>

          {/* ================================================= */}
          {/* COMMUNITY */}
          {/* ================================================= */}

          <FooterColumn title="Community">
            <FooterButton
              onClick={() =>
                onAmbassadors && onAmbassadors()
              }
            >
              Campus Ambassadors
            </FooterButton>

            {/*
              Add these once their real pages exist:

              <FooterLink href="/universities">
                Universities
              </FooterLink>

              <FooterLink href="/safety">
                Safety
              </FooterLink>

              <FooterLink href="/about">
                About Neptune
              </FooterLink>
            */}
          </FooterColumn>

          {/* ================================================= */}
          {/* ACCOUNT */}
          {/* ================================================= */}

          <FooterColumn title="Account">
            <FooterButton
              onClick={() =>
                onGetStarted && onGetStarted("signin")
              }
            >
              Log In
            </FooterButton>

            <FooterButton
              onClick={() =>
                onGetStarted && onGetStarted("signup")
              }
            >
              Sign Up
            </FooterButton>
          </FooterColumn>
        </div>

        {/* ================================================= */}
        {/* SEO DESCRIPTION STRIP */}
        {/* ================================================= */}

        <div
          className="
            mt-10
            pt-7
            border-t
            border-white/10
          "
        >
          <div
            className="
              flex
              flex-col
              lg:flex-row
              items-start
              lg:items-center
              justify-between
              gap-5
            "
          >
            <p className="max-w-2xl text-white/40 text-xs leading-relaxed">
              Neptune Chat is a college-focused random video chat
              platform where verified students can meet and talk with
              other college students through live video and text chat.
            </p>

            {/* Social */}
            <div className="flex items-center gap-2">
              <SocialLink
                href="#"
                label="Instagram"
              >
                <InstagramIcon />
              </SocialLink>

              <SocialLink
                href="#"
                label="TikTok"
              >
                ♪
              </SocialLink>

              <SocialLink
                href="#"
                label="YouTube"
              >
                ▶
              </SocialLink>

              <SocialLink
                href="#"
                label="Discord"
              >
                ◆
              </SocialLink>
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* BOTTOM ROW */}
        {/* ================================================= */}

        <div
          className="
            mt-7
            pt-6
            border-t
            border-white/10
            flex
            flex-col
            md:flex-row
            items-center
            justify-between
            gap-4
          "
        >
          <p className="text-white/35 text-xs text-center md:text-left">
            © 2026 The Neptune Way LLC, A Florida Limited
            Liability Company. All rights reserved.
          </p>

          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            {/*
              Replace these with real links when we create the pages.

              Do NOT point these to fake URLs yet because broken links
              are bad for users and SEO.
            */}

            <span className="text-white/30 text-xs">
              Privacy
            </span>

            <span className="text-white/30 text-xs">
              Terms
            </span>

            <span className="text-white/30 text-xs">
              Community Guidelines
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ========================================================= */
/* FOOTER COLUMN */
/* ========================================================= */

function FooterColumn({
  title,
  children,
}) {
  return (
    <div>
      <h2
        className="
          text-white
          text-sm
          font-extrabold
          tracking-wide
        "
      >
        {title}
      </h2>

      <div className="mt-4 flex flex-col items-start gap-3">
        {children}
      </div>
    </div>
  );
}

/* ========================================================= */
/* REAL SEO LINK */
/* ========================================================= */

function FooterLink({
  href,
  children,
}) {
  return (
    <a
      href={href}
      className="
        group
        inline-flex
        items-center
        gap-1
        text-white/50
        text-sm
        font-medium
        transition-all
        duration-200
        hover:text-yellow-300
      "
    >
      <span>
        {children}
      </span>

      <span
        className="
          opacity-0
          -translate-x-1
          group-hover:opacity-100
          group-hover:translate-x-0
          transition-all
          duration-200
        "
      >
        →
      </span>
    </a>
  );
}

/* ========================================================= */
/* BUTTON LINK */
/* ========================================================= */

function FooterButton({
  children,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        group
        inline-flex
        items-center
        gap-1
        text-white/50
        text-sm
        font-medium
        transition-all
        duration-200
        hover:text-yellow-300
      "
    >
      <span>
        {children}
      </span>

      <span
        className="
          opacity-0
          -translate-x-1
          group-hover:opacity-100
          group-hover:translate-x-0
          transition-all
          duration-200
        "
      >
        →
      </span>
    </button>
  );
}

/* ========================================================= */
/* SOCIAL LINK */
/* ========================================================= */

function SocialLink({
  href,
  label,
  children,
}) {
  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      className="
        w-9
        h-9
        rounded-full
        bg-white/5
        border
        border-white/10
        flex
        items-center
        justify-center
        text-white/50
        text-sm
        font-bold
        transition-all
        duration-200
        hover:bg-white/10
        hover:border-white/20
        hover:text-yellow-300
        hover:scale-110
      "
    >
      {children}
    </a>
  );
}

/* ========================================================= */
/* INSTAGRAM */
/* ========================================================= */

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="w-4 h-4"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="5"
        ry="5"
      />

      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />

      <line
        x1="17.5"
        y1="6.5"
        x2="17.51"
        y2="6.5"
      />
    </svg>
  );
}

/* ========================================================= */
/* NEPTUNE LOGO */
/* ========================================================= */

function NeptuneIcon({
  size = 28,
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden="true"
      style={{
        filter:
          "drop-shadow(0 0 6px rgba(96,165,250,0.8)) drop-shadow(0 0 16px rgba(96,165,250,0.5))",
      }}
    >
      <defs>
        <radialGradient
          id="neptuneFooterBody"
          cx="35%"
          cy="30%"
          r="75%"
        >
          <stop
            offset="0%"
            stopColor="#7dd3fc"
          />

          <stop
            offset="45%"
            stopColor="#38bdf8"
          />

          <stop
            offset="100%"
            stopColor="#1d4ed8"
          />
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
        fill="url(#neptuneFooterBody)"
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