import { useState, useEffect, useMemo } from "react";
import Nav from "./Nav";

// Launch has already happened — this stays in the past so the top banner
// renders its "Neptune Chat is live" state instead of a countdown. The
// nightly window below is what actually gates access now.
const LAUNCH_DATE = new Date(2026, 8, 4, 20, 0, 0);

// Date the nightly-window restriction starts being enforced. Before this
// date the site is always open. From this date on, it's only reachable
// during the nightly window below.
//
// Window is 8 PM–3 AM, evaluated in America/New_York — same rule enforced
// server-side and mirrored in ChatRoom.jsx's isChatLive(). Using a fixed
// timezone here (rather than the visitor's local time) is what keeps this
// page, the chat room, and the FAQ copy ("8 PM–3 AM ET") all in agreement
// regardless of where someone's browser thinks it is.
const ENFORCEMENT_START = new Date(2026, 8, 3, 0, 0, 0);
const OPEN_HOUR_ET = 20; // 8:00 PM ET
const CLOSE_HOUR_ET = 3; // 3:00 AM ET (next day) — window wraps past midnight

// Pulls the current wall-clock hour/minute/second in America/New_York out of
// a Date, regardless of the visitor's own timezone.
function getETParts(date) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(date).reduce((acc, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});
  return {
    // "24" shows up for midnight in some environments — normalize to 0.
    hour: parseInt(parts.hour, 10) % 24,
    minute: parseInt(parts.minute, 10),
    second: parseInt(parts.second, 10),
  };
}

// Window wraps past midnight (8 PM -> 3 AM), so "live" means either
// "at or after 8 PM ET" OR "before 3 AM ET" — not a simple between-check.
function isWithinNightlyWindow(date) {
  const { hour } = getETParts(date);
  return hour >= OPEN_HOUR_ET || hour < CLOSE_HOUR_ET;
}

// Milliseconds from `now` until the next 8 PM ET boundary, computed off the
// ET wall clock (not the visitor's local hours) so the countdown matches
// the actual reopen time everywhere.
function getMsUntilNextOpenET(now) {
  const { hour, minute, second } = getETParts(now);
  const nowSeconds = hour * 3600 + minute * 60 + second;
  const targetSeconds = OPEN_HOUR_ET * 3600;

  let diffSeconds = targetSeconds - nowSeconds;
  if (diffSeconds <= 0) diffSeconds += 86400; // already past 8 PM today, so it's tomorrow

  return diffSeconds * 1000;
}

function formatDuration(ms) {
  if (ms <= 0) return "0h 0m 0s";
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}h ${m}m ${s}s`;
}

// Shared keyframes. Mounted by both the open page and the closed screen —
// the closed screen returns early, before LandingPage's own markup renders,
// so without this its stars and crests would sit frozen.
function NeptuneKeyframes() {
  return (
    <style>{`
      @keyframes marquee {
        from { transform: translateX(0); }
        to { transform: translateX(-50%); }
      }
      @keyframes twinkle {
        0%, 100% { opacity: 0.15; transform: scale(0.85); }
        50% { opacity: 0.9; transform: scale(1.1); }
      }
      @keyframes drift {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-14px); }
        100% { transform: translateY(0px); }
      }
      @keyframes floatSlow {
        0% { transform: translate(0px, 0px) rotate(var(--rot, 0deg)); }
        50% { transform: translate(var(--dx, 12px), var(--dy, -18px)) rotate(var(--rot, 0deg)); }
        100% { transform: translate(0px, 0px) rotate(var(--rot, 0deg)); }
      }
      @keyframes orbDrift {
        0%, 100% { transform: translate(0px, 0px) scale(1); }
        33% { transform: translate(30px, -40px) scale(1.08); }
        66% { transform: translate(-25px, 25px) scale(0.95); }
      }
    `}</style>
  );
}

// Ambient background orbs — extracted so the open page and the closed
// screen share one definition instead of drifting apart over time.
function AmbientOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-yellow-300/20 blur-3xl"
        style={{ animation: "orbDrift 22s ease-in-out infinite" }}
      />
      <div
        className="absolute top-1/3 -right-32 w-[28rem] h-[28rem] rounded-full bg-cyan-300/10 blur-3xl"
        style={{ animation: "orbDrift 28s ease-in-out infinite reverse" }}
      />
      <div
        className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-white/10 blur-3xl"
        style={{ animation: "orbDrift 18s ease-in-out infinite" }}
      />
      <div
        className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-pink-300/10 blur-3xl"
        style={{ animation: "orbDrift 24s ease-in-out infinite reverse" }}
      />
    </div>
  );
}

// Stands in for the planet Neptune — a blue/cyan gradient sphere with a
// tilted white atmospheric band. Same mark as Nav.jsx, EduAuth.jsx and
// ChatRoom.jsx, so the logo is consistent everywhere in the product.
function NeptuneIcon({ size = 26 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      style={{
        filter:
          "drop-shadow(0 0 6px rgba(96,165,250,0.8)) drop-shadow(0 0 16px rgba(96,165,250,0.5))",
      }}
    >
      <defs>
        <radialGradient id="neptuneBodyLanding" cx="35%" cy="30%" r="75%">
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
      <circle cx="20" cy="19" r="12" fill="url(#neptuneBodyLanding)" />
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

// Full-screen "closed" state shown once enforcement has started and we're
// outside the 8 PM–3 AM ET window. Deliberately built from the same pieces
// as the open landing page — same gradient, orbs, crests, star field, hero
// type scale and LED countdown panel — so it reads as the same product
// taking a break, not as an error page.
function ClosedScreen({ now, onGetStarted }) {
  const msLeft = getMsUntilNextOpenET(now);

  return (
    <div
      className="min-h-screen w-full bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-600 overflow-hidden relative flex flex-col"
      style={{ zoom: 1.2 }}
    >
      <NeptuneKeyframes />
      <AmbientOrbs />
      <ScatteredCrests />
      <StarField />

      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-16 text-center">
        <div className="max-w-lg">
          {/* Logo lockup, same mark and wordmark treatment as the nav */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <NeptuneIcon size={44} />
            <span
              className="text-2xl md:text-3xl font-extrabold text-white tracking-tight"
              style={{ textShadow: "0 0 14px rgba(165,180,252,0.5)" }}
            >
              Neptune Chat
            </span>
          </div>

          {/* Amber counterpart to the hero's emerald "verified" pill */}
          <div
            className="inline-flex items-center gap-2 rounded-full bg-black/25 border border-yellow-300/30 backdrop-blur px-4 py-1.5 mb-6"
            style={{ boxShadow: "0 0 16px rgba(253,224,71,0.3)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-300 animate-pulse shadow-[0_0_8px_rgba(253,224,71,0.9)]" />
            <span className="text-white/80 text-[11px] font-bold uppercase tracking-widest">
              Closed right now
            </span>
          </div>

          <h1
            className="text-5xl md:text-6xl font-extrabold text-white leading-[1.05] tracking-tight"
            style={{
              textShadow:
                "0 0 30px rgba(253,224,71,0.25), 0 0 60px rgba(165,180,252,0.2)",
            }}
          >
            Everyone's
            <br />
            asleep
          </h1>

          <p className="mt-6 text-lg md:text-xl text-white/70 max-w-md mx-auto">
            Neptune Chat runs nightly from{" "}
            <span className="text-white font-semibold">
              8:00 PM to 3:00 AM Eastern
            </span>
            . Join the wait party now, get your account ready, and come back when chat opens.
          </p>

          {/* Same recessed LED panel as the launch countdown strip */}
          <div
            className="mt-8 inline-flex flex-col items-center rounded-xl bg-black/40 border border-yellow-300/30 px-8 py-4"
            style={{
              boxShadow:
                "inset 0 1px 3px rgba(0,0,0,0.5), 0 0 12px rgba(253,224,71,0.25)",
            }}
          >
            <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1.5">
              Opens in
            </span>
            <span
              className="font-mono font-bold text-2xl md:text-3xl text-yellow-300 tabular-nums tracking-wide"
              style={{ textShadow: LED_GLOW }}
            >
              {formatDuration(msLeft)}
            </span>
          </div>

          {/* Closed-hours auth actions — account creation and sign-in stay available
              even though random matching is disabled until the nightly window opens. */}
          <div className="mt-6 flex flex-col items-center gap-3">
            <button
              onClick={() => onGetStarted?.("signup")}
              className="group px-10 py-4 bg-yellow-400 text-indigo-900 font-extrabold rounded-full shadow-lg transition-all duration-200 hover:bg-yellow-300 hover:scale-105 hover:shadow-yellow-300/60 hover:shadow-2xl active:scale-95 text-lg md:text-xl"
              style={{
                boxShadow:
                  "0 0 24px rgba(253,224,71,0.5), 0 0 60px rgba(253,224,71,0.20)",
              }}
            >
              <span className="inline-flex items-center gap-2">
                🎉 Join the Wait Party
                <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </span>
            </button>

            <p className="text-white/50 text-sm max-w-sm mx-auto">
              Sign up and verify your college email now so you're ready when
              Neptune opens.
            </p>

            <button
              onClick={() => onGetStarted?.("login")}
              className="text-white/75 hover:text-white text-sm font-semibold underline underline-offset-4 transition-colors"
            >
              Already have an account? Sign in
            </button>
          </div>
        </div>
      </div>

      <footer className="relative z-10 text-center pb-10">
        <p className="text-white/40 text-xs">
          © 2026 The Neptune Way LLC, A Florida Limited Liability Company. All
          rights reserved.
        </p>
      </footer>
    </div>
  );
}

export default function LandingPage({ onGetStarted, onAmbassadors }) {
  // Ticks once a second so the open/closed check and countdown stay live.
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const enforcementActive = now >= ENFORCEMENT_START;
  const withinWindow = isWithinNightlyWindow(now);

  if (enforcementActive && !withinWindow) {
    return <ClosedScreen now={now} onGetStarted={onGetStarted} />;
  }

  return (
    <div
      className="min-h-screen w-full bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-600 overflow-hidden relative"
      style={{ zoom: 1.2 }}
    >
      <NeptuneKeyframes />

      {/* Ambient background orbs — slow independent drift so the whole scene feels alive, not static */}
      <AmbientOrbs />

      {/* Scattered ghost-crest watermarks — Unilink-style texture behind the whole page */}
      <ScatteredCrests />

      {/* Twinkling star field */}
      <StarField />

      {/* Launch countdown — pinned above everything, including nav */}
      <LaunchCountdown target={LAUNCH_DATE} />

      {/* Nav — shared across every page. On the home page, "Video Chat" and
          the logo both just scroll back up to the hero. */}
      <Nav
        onHome={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        onAmbassadors={onAmbassadors}
        onGetStarted={onGetStarted}
      />

      {/* Social rail — pinned to the left edge, like a campus bulletin strip */}
      <SocialRail />

      {/* Hero */}
      <header className="relative z-10 max-w-3xl mx-auto px-6 pt-8 pb-12 text-center">
        <div
          className="inline-flex items-center gap-2 rounded-full bg-black/25 border border-emerald-300/30 backdrop-blur px-4 py-1.5 mb-6"
          style={{ boxShadow: "0 0 16px rgba(52,211,153,0.35)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
          <span className="text-white/80 text-[11px] font-bold uppercase tracking-widest">
            College Student Verified
          </span>
        </div>

        <h1
          className="text-5xl md:text-7xl font-extrabold text-white leading-[1.03] tracking-tight"
          style={{
            textShadow:
              "0 0 30px rgba(253,224,71,0.25), 0 0 60px rgba(165,180,252,0.2)",
          }}
        >
          Meet college students
          <br />
          from around the world
        </h1>

        <p className="mt-6 text-lg md:text-xl text-white/70 max-w-xl mx-auto">
          Neptune Chat pairs you with a random verified college student for
          live video and text. No profiles, no swiping, just a real
          conversation.
        </p>

        {/* Nightly-hours note — sets the expectation before someone taps in
            and hits the closed screen later. */}
        <p className="mt-3 text-white/50 text-sm">
          Live nightly, 8 PM–3 AM ET.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => onGetStarted("signup")}
            className="group px-12 py-5 bg-yellow-400 text-indigo-900 font-extrabold rounded-full shadow-lg transition-all duration-200 hover:bg-yellow-300 hover:scale-105 hover:shadow-yellow-300/60 hover:shadow-2xl active:scale-95 text-xl md:text-2xl"
            style={{
              boxShadow:
                "0 0 24px rgba(253,224,71,0.5), 0 0 60px rgba(253,224,71,0.25)",
            }}
          >
            <span className="inline-flex items-center gap-3">
              Start Video Chat
              <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">
                →
              </span>
            </span>
          </button>
        </div>
      </header>

      {/* Preview mock — stand-in for the real video panels */}
      <div className="relative z-10 max-w-3xl mx-auto px-6 pb-16">
        <div className="flex gap-3 rounded-2xl bg-black/20 border border-white/10 p-3 shadow-2xl backdrop-blur">
          <div className="flex-1 aspect-video rounded-xl bg-slate-900/80 flex items-center justify-center">
            <span className="text-white/30 text-sm font-medium">You</span>
          </div>
          <div className="flex-1 aspect-video rounded-xl bg-slate-900/80 flex items-center justify-center">
            <span className="text-white/30 text-sm font-medium">
              A random neptuner
            </span>
          </div>
        </div>
      </div>

      {/* Logo conveyor belt */}
      <LogoConveyor />

      {/* About */}
      <section
        id="about"
        className="relative z-10 max-w-2xl mx-auto px-6 pb-16 text-center scroll-mt-24"
      >
        <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          About Neptune Chat
        </h2>
        <p className="mt-4 text-white/70 text-sm md:text-base leading-relaxed">
          Neptune Chat was built for one simple reason: campus is full of
          people you haven't met yet. Instead of another swipe-based app, we
          made a space where verified students can jump on video or text with
          someone new in seconds — no profile to build, no matching
          algorithm, just a real conversation with someone else on campus.
        </p>
      </section>

      {/* Features */}
      <section
        id="how-it-works"
        className="relative z-10 max-w-4xl mx-auto px-6 pb-16 grid grid-cols-1 md:grid-cols-3 gap-5 scroll-mt-24"
      >
        <FeatureCard
          icon="🎓"
          title=".edu verified"
          body="Every account is confirmed with a real college email, so you're always talking to another student."
        />
        <FeatureCard
          icon="🎥"
          title="Video + text"
          body="Jump on camera or keep it typed — switch however you're comfortable in the moment."
        />
        <FeatureCard
          icon="⏭️"
          title="Next, anytime"
          body="Not vibing? Hit Next and you're instantly paired with someone else. No awkward goodbyes."
        />
      </section>

      {/* Comparison table */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 pb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Why Neptune Chat is different
          </h2>
          <p className="mt-3 text-white/60 max-w-lg mx-auto text-sm">
            Built specifically for verified college students, not the open
            internet.
          </p>
        </div>

        <p className="text-white/70 text-sm max-w-xl mx-auto text-center mb-6 leading-relaxed">
          Most random chat apps let anyone sign up with just an email
          address. Neptune Chat requires a verified college email before
          you can talk to anyone, so here's how that compares to a few
          well-known alternatives.
        </p>

        <div className="rounded-2xl bg-white/10 border border-white/20 backdrop-blur shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-4 px-5 text-white/50 font-semibold uppercase text-xs tracking-wide">
                    Feature
                  </th>
                  <th className="py-4 px-5 text-yellow-300 font-bold text-base">
                    Neptune Chat
                  </th>
                  <th className="py-4 px-5 text-white/50 font-semibold">
                    Ome.tv
                  </th>
                  <th className="py-4 px-5 text-white/50 font-semibold">
                    Monkey
                  </th>
                  <th className="py-4 px-5 text-white/50 font-semibold">
                    Chatroulette
                  </th>
                </tr>
              </thead>
              <tbody>
                <ComparisonRow
                  label="Requires college email"
                  neptune="Verified"
                  others={["Not required", "Not required", "Not required"]}
                />
                <ComparisonRow
                  label="Age-verified accounts"
                  neptune="Verified"
                  others={["Unverified", "Unverified", "Unverified"]}
                />
                <ComparisonRow
                  label="Password-protected login"
                  neptune="Secure login"
                  others={["Open access", "Open access", "Open access"]}
                />
                <ComparisonRow
                  label="Video + text together"
                  neptune="Included"
                  others={["Included", "Included", "Included"]}
                />
                <ComparisonRow
                  label="Instant re-match"
                  neptune="Instant Next"
                  others={["Instant Next", "Instant Next", "Instant Next"]}
                  last
                />
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-center text-white/30 text-xs mt-4 italic">
          Based on each platform's publicly stated sign-up requirements as of
          2026. Feature availability may change over time.
        </p>
      </section>

      {/* Ambassadors teaser */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 pb-16">
        <div className="rounded-2xl bg-white/10 border border-white/20 backdrop-blur shadow-xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-yellow-300 mb-2">
              Campus Ambassadors
            </span>
            <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Repping Neptune Chat on your campus?
            </h3>
            <p className="mt-2 text-white/70 text-sm md:text-base max-w-md">
              Get perks, swag, and early features for helping other verified
              students discover Neptune Chat.
            </p>
          </div>
          <button
            onClick={() => onAmbassadors && onAmbassadors()}
            className="shrink-0 px-8 py-4 rounded-full bg-yellow-400 text-indigo-900 font-extrabold shadow-md transition-all duration-200 hover:bg-yellow-300 hover:scale-105 hover:shadow-yellow-300/50 hover:shadow-lg active:scale-95"
            style={{ boxShadow: "0 0 18px rgba(253,224,71,0.4)" }}
          >
            Apply to Be an Ambassador →
          </button>
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className="relative z-10 max-w-2xl mx-auto px-6 pb-20 scroll-mt-24"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Frequently asked questions
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          <FaqItem
            question="What hours is Neptune Chat open?"
            answer="Every night from 8:00 PM to 3:00 AM Eastern. Outside those hours the site shows a countdown to the next opening, and matching is turned off."
          />
          <FaqItem
            question="Do I need a .edu email to use Neptune Chat?"
            answer="Yes. Every account is verified with a real college or university email address ending in .edu before you can start chatting. This keeps the platform limited to actual college students."
          />
          <FaqItem
            question="Is it really random?"
            answer="Yes — you're paired with the next available verified student in the queue. There are no profiles, filters, or swiping involved."
          />
          <FaqItem
            question="Can I use text chat instead of video?"
            answer="Both are available in the same chat window. You can type messages alongside the video call, whether or not your camera is on."
          />
          <FaqItem
            question="What if I want to leave a conversation?"
            answer="Hit Next to end the current chat and get paired with someone new, or hit Stop to leave the queue entirely and return to the home screen."
          />
          <FaqItem
            question="Is my information kept private?"
            answer="Your video and audio go directly between you and the person you're matched with — it isn't stored on our servers. Your email is only used for account verification and login."
          />
          <FaqItem
            question="What happens if someone behaves inappropriately?"
            answer="You can leave the chat instantly with the Next or Stop button. Reporting tools are on our roadmap to help keep the community accountable."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 text-center pb-10">
        <p className="text-white/40 text-xs">
          © 2026 The Neptune Way LLC, A Florida Limited Liability Company. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

// Add each school's logo file to public/logos/ (see naming below), then
// point `logo` at it, e.g. "/logos/ucf.png". Keep files transparent-background
// PNGs/SVGs where possible, trimmed of extra padding, for a consistent row.
const COLLEGES = [
  { name: "UCF", logo: "/logos/ucf.png" },
  { name: "Michigan State University", logo: "/logos/msu.png" },
  { name: "ASU", logo: "/logos/asu.png" },
  { name: "UF", logo: "/logos/uf.png" },
  { name: "FSU", logo: "/logos/fsu.png" },
  { name: "FAU", logo: "/logos/fau.png" },
  { name: "University of Georgia", logo: "/logos/uga.png" },
  { name: "Ohio State", logo: "/logos/osu.png" },
  { name: "University of Miami", logo: "/logos/umiami.png" },
  { name: "UCLA", logo: "/logos/ucla.png" },
  { name: "USC", logo: "/logos/usc.png" },
];

// Deterministic-ish scatter of campus/Greek-life iconography across the
// full page — grad caps, Greek letters, diploma scrolls, columned houses —
// like Unilink's ghost crests, but grounded in college life instead of
// school branding. Given a soft glow so they read as a deliberate texture
// rather than disappearing into the gradient.
const CAMPUS_ICONS = ["🎓", "Σ", "🎓", "Δ", "🏛️", "Ω", "🎓", "Φ", "📜", "Θ", "🎓", "Π"];

function ScatteredCrests() {
  const placements = useMemo(() => {
    // Fixed layout (not randomized on every render) so it doesn't jitter
    // on re-render/state changes.
    return [
      { top: "2%", left: "4%", rot: -12, size: "text-6xl", dx: 14, dy: -10, dur: 16 },
      { top: "4%", left: "26%", rot: 6, size: "text-4xl", dx: -10, dy: 12, dur: 13 },
      { top: "6%", left: "45%", rot: 8, size: "text-5xl", dx: -10, dy: 12, dur: 13 },
      { top: "8%", left: "62%", rot: -14, size: "text-4xl", dx: 12, dy: 10, dur: 17 },
      { top: "5%", left: "88%", rot: -8, size: "text-6xl", dx: -16, dy: -12, dur: 19 },
      { top: "16%", left: "12%", rot: 10, size: "text-5xl", dx: 10, dy: 16, dur: 21 },
      { top: "18%", left: "35%", rot: -9, size: "text-4xl", dx: -8, dy: 14, dur: 14 },
      { top: "15%", left: "78%", rot: -6, size: "text-5xl", dx: -12, dy: 8, dur: 15 },
      { top: "26%", left: "3%", rot: 14, size: "text-4xl", dx: 8, dy: -14, dur: 12 },
      { top: "28%", left: "50%", rot: 12, size: "text-6xl", dx: -10, dy: -14, dur: 20 },
      { top: "24%", left: "92%", rot: -10, size: "text-5xl", dx: 16, dy: 10, dur: 18 },
      { top: "36%", left: "20%", rot: 7, size: "text-5xl", dx: -14, dy: -16, dur: 14 },
      { top: "38%", left: "68%", rot: -8, size: "text-4xl", dx: -18, dy: 14, dur: 22 },
      { top: "46%", left: "8%", rot: 6, size: "text-4xl", dx: 12, dy: 12, dur: 17 },
      { top: "48%", left: "42%", rot: -14, size: "text-5xl", dx: -10, dy: -10, dur: 11 },
      { top: "44%", left: "84%", rot: 9, size: "text-6xl", dx: 14, dy: -12, dur: 20 },
      { top: "56%", left: "28%", rot: -6, size: "text-4xl", dx: -12, dy: 16, dur: 15 },
      { top: "58%", left: "58%", rot: 11, size: "text-5xl", dx: 10, dy: 14, dur: 16 },
      { top: "60%", left: "94%", rot: -10, size: "text-4xl", dx: -16, dy: 10, dur: 16 },
      { top: "68%", left: "6%", rot: 9, size: "text-6xl", dx: 10, dy: -14, dur: 23 },
      { top: "70%", left: "38%", rot: -12, size: "text-4xl", dx: -8, dy: 12, dur: 13 },
      { top: "66%", left: "74%", rot: 6, size: "text-5xl", dx: 12, dy: -10, dur: 19 },
      { top: "78%", left: "16%", rot: -8, size: "text-5xl", dx: -14, dy: 14, dur: 18 },
      { top: "80%", left: "50%", rot: 5, size: "text-4xl", dx: 14, dy: 14, dur: 19 },
      { top: "82%", left: "86%", rot: -8, size: "text-6xl", dx: -10, dy: -12, dur: 13 },
      { top: "90%", left: "30%", rot: 10, size: "text-5xl", dx: 10, dy: 10, dur: 21 },
      { top: "92%", left: "64%", rot: -6, size: "text-4xl", dx: -12, dy: -14, dur: 15 },
      { top: "95%", left: "10%", rot: 7, size: "text-5xl", dx: 8, dy: 12, dur: 17 },
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
            opacity: 0.55,
            filter:
              "drop-shadow(0 0 6px rgba(253,224,71,0.55)) drop-shadow(0 0 16px rgba(253,224,71,0.3))",
          }}
        >
          {CAMPUS_ICONS[i % CAMPUS_ICONS.length]}
        </span>
      ))}
    </div>
  );
}

// Small twinkling dots drifting across the gradient — cheap ambient texture,
// mirrors the tiny star specks in Unilink's dark background.
function StarField() {
  const stars = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 48; i++) {
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

// Decorative social rail pinned to the left edge — swap hrefs for real
// profiles once they exist. Hidden on small screens so it doesn't crowd
// the mobile layout.
const SOCIAL_LINKS = [
  { label: "TikTok", href: "#", glyph: "♪", glow: "rgba(255,255,255,0.6)" },
  { label: "Instagram", href: "#", icon: "instagram", glow: "rgba(232,121,249,0.85)" },
  { label: "Discord", href: "#", glyph: "◆", glow: "rgba(129,140,248,0.85)" },
  { label: "YouTube", href: "#", glyph: "▶", glow: "rgba(248,113,113,0.85)" },
];

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function SocialRail() {
  return (
    <div className="hidden lg:flex flex-col items-center gap-4 fixed left-6 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/25 border border-white/20 backdrop-blur px-3.5 py-5 shadow-xl">
      <span className="text-white/70 text-[11px] font-extrabold uppercase tracking-widest mb-1">
        Follow
        <br />
        Us
      </span>
      <span className="w-6 h-px bg-white/20" />
      {SOCIAL_LINKS.map((s) => (
        <a
          key={s.label}
          href={s.href}
          aria-label={s.label}
          title={s.label}
          className="w-11 h-11 rounded-full bg-white/10 border border-white/20 backdrop-blur flex items-center justify-center text-white text-lg font-bold transition-all duration-200 hover:bg-white/20 hover:scale-110"
          style={{
            animation: `drift 4s ease-in-out infinite`,
            boxShadow: `0 0 14px ${s.glow}, 0 0 4px ${s.glow}`,
          }}
        >
          {s.icon === "instagram" ? <InstagramIcon /> : s.glyph}
        </a>
      ))}
    </div>
  );
}

function LogoConveyor() {
  // Track is duplicated so the belt can loop seamlessly at translateX(-50%)
  const track = [...COLLEGES, ...COLLEGES];

  return (
    <div className="relative z-10 max-w-5xl mx-auto px-6 pb-16">
      <p className="text-center text-white/40 text-xs font-semibold tracking-widest uppercase mb-5">
        Trusted by students at
      </p>
      <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div
          className="flex w-max items-center gap-4 [animation:marquee_26s_linear_infinite] hover:[animation-play-state:paused]"
        >
          {track.map((school, i) => (
            <LogoTile key={i} school={school} />
          ))}
        </div>
      </div>
    </div>
  );
}

function LogoTile({ school }) {
  // Falls back to the school's name if the logo file is missing/not added yet,
  // instead of showing a broken-image icon.
  const [failed, setFailed] = useState(false);

  return (
    <div className="shrink-0 flex items-center justify-center h-16 w-32 rounded-xl bg-white/10 border border-white/15 backdrop-blur transition-colors duration-200 hover:bg-white/[0.16] px-4">
      {failed ? (
        <span className="text-white/60 font-semibold text-xs text-center leading-tight">
          {school.name}
        </span>
      ) : (
        <img
          src={school.logo}
          alt={school.name}
          title={school.name}
          className="max-h-8 max-w-full w-auto object-contain"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

function FeatureCard({ icon, title, body }) {
  return (
    <div className="rounded-2xl bg-white/10 border border-white/20 backdrop-blur p-6 text-left transition-all duration-200 hover:bg-white/15 hover:border-white/30 hover:-translate-y-1">
      <span className="text-3xl">{icon}</span>
      <h3 className="mt-3 text-white font-bold text-lg">{title}</h3>
      <p className="mt-1.5 text-white/70 text-sm leading-relaxed">{body}</p>
    </div>
  );
}

function ComparisonRow({ label, neptune, others, last }) {
  return (
    <tr className={last ? "" : "border-b border-white/10"}>
      <td className="py-4 px-5 text-white/80 font-medium">{label}</td>
      <td className="py-4 px-5">
        <Mark value={neptune} highlight />
      </td>
      {others.map((val, i) => (
        <td key={i} className="py-4 px-5">
          <Mark value={val} />
        </td>
      ))}
    </tr>
  );
}

// Words carrying a positive meaning render green, negative words render rose,
// anything else (neutral/shared features) renders a soft slate.
const POSITIVE_WORDS = [
  "verified",
  "secure login",
  "included",
  "instant next",
];
const NEGATIVE_WORDS = ["not required", "unverified", "open access"];

function Mark({ value, highlight }) {
  const normalized = value.toLowerCase();
  let tone = "text-white/60 font-medium";

  if (POSITIVE_WORDS.includes(normalized)) {
    tone = highlight
      ? "text-emerald-300 font-semibold"
      : "text-emerald-300/70 font-medium";
  } else if (NEGATIVE_WORDS.includes(normalized)) {
    tone = "text-rose-300/70 font-medium";
  }

  return <span className={tone}>{value}</span>;
}

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`rounded-xl border backdrop-blur overflow-hidden transition-all duration-300 ${
        open
          ? "bg-white/15 border-yellow-300/40 shadow-lg"
          : "bg-white/10 border-white/20 hover:bg-white/[0.13]"
      }`}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span
          className={`font-semibold text-sm md:text-base transition-colors duration-200 ${
            open ? "text-yellow-300" : "text-white"
          }`}
        >
          {question}
        </span>
        <span
          className={`shrink-0 flex items-center justify-center w-7 h-7 rounded-full transition-all duration-300 ${
            open ? "bg-yellow-400 rotate-[135deg]" : "bg-white/10"
          }`}
        >
          <span
            className={`text-lg leading-none transition-colors duration-300 ${
              open ? "text-indigo-900" : "text-yellow-300"
            }`}
          >
            +
          </span>
        </span>
      </button>

      {/* Smooth grid-based expand/collapse, no layout jump */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-4 text-white/70 text-sm leading-relaxed border-t border-white/10 pt-3">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

// Signature element: a top-of-page LED strip, styled like an old digital
// clock face set into the gradient — dark recessed panel, amber tabular
// digits with a soft glow, thin segment-style dividers. Collapses into a
// plain "LIVE" readout once the target time passes.
function useCountdown(target) {
  const getRemaining = () => {
    const diff = target.getTime() - Date.now();
    return diff > 0 ? diff : 0;
  };

  const [remaining, setRemaining] = useState(getRemaining);

  useEffect(() => {
    const id = setInterval(() => setRemaining(getRemaining()), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const totalSeconds = Math.floor(remaining / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    isLive: remaining <= 0,
  };
}

function LaunchCountdown({ target }) {
  const { days, hours, minutes, seconds, isLive } = useCountdown(target);

  const dateLabel = target.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
  });
  const timeLabel = target.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  if (isLive) {
    return (
      <div className="relative z-20 w-full bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-3xl mx-auto px-6 py-2.5 flex items-center justify-center gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
          <span
            className="font-mono font-bold text-sm tracking-[0.2em] uppercase text-emerald-400"
            style={{ textShadow: "0 0 10px rgba(52,211,153,0.6)" }}
          >
            Neptune Chat is live
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-20 w-full bg-black/30 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-3xl mx-auto px-6 py-2.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
        <span className="text-white/40 text-[10px] sm:text-xs font-semibold tracking-widest uppercase">
          Launching {dateLabel} · {timeLabel}
        </span>

        <div
          className="flex items-center rounded-md bg-black/40 border border-yellow-300/30 px-2.5 sm:px-3 py-1 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]"
          style={{ boxShadow: "inset 0 1px 3px rgba(0,0,0,0.5), 0 0 12px rgba(253,224,71,0.25)" }}
        >
          <LedDigits value={days} min={2} />
          <LedLabel>d</LedLabel>
          <LedColon />
          <LedDigits value={hours} min={2} />
          <LedLabel>h</LedLabel>
          <LedColon />
          <LedDigits value={minutes} min={2} />
          <LedLabel>m</LedLabel>
          <LedColon />
          <LedDigits value={seconds} min={2} />
          <LedLabel>s</LedLabel>
        </div>
      </div>
    </div>
  );
}

const LED_GLOW = "0 0 6px rgba(253,224,71,0.75), 0 0 14px rgba(253,224,71,0.35)";

function LedDigits({ value, min }) {
  return (
    <span
      className="font-mono font-bold text-sm sm:text-base text-yellow-300 tabular-nums tracking-wide"
      style={{ textShadow: LED_GLOW }}
    >
      {String(value).padStart(min, "0")}
    </span>
  );
}

function LedLabel({ children }) {
  return (
    <span className="font-mono text-[9px] sm:text-[10px] text-yellow-300/50 mr-1.5 sm:mr-2">
      {children}
    </span>
  );
}

function LedColon() {
  return (
    <span
      className="font-mono font-bold text-sm sm:text-base text-yellow-300/40 mr-1.5 sm:mr-2 animate-pulse select-none"
    >
      :
    </span>
  );
}