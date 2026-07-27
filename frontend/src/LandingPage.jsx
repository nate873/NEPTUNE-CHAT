import { useState } from "react";

export default function LandingPage({ onGetStarted }) {
  return (
    <div
      className="min-h-screen w-full bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-600 overflow-hidden relative"
      style={{ zoom: 1.2}}
    >
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>

      {/* Ambient background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-yellow-300/20 blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-[28rem] h-[28rem] rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 w-full px-6 md:px-10 py-4">
        <div className="flex items-center justify-between gap-6">
          {/* Logo — pinned to the very left edge */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-2xl">🔱</span>
            <span className="text-white font-bold text-lg tracking-tight whitespace-nowrap">
              Neptune Chat
            </span>
          </div>

          {/* Center links */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#about"
              className="text-white/70 text-sm font-semibold hover:text-white transition"
            >
              About
            </a>
            <a
              href="#how-it-works"
              className="text-white/70 text-sm font-semibold hover:text-white transition"
            >
              How It Works
            </a>
            <a
              href="#faq"
              className="text-white/70 text-sm font-semibold hover:text-white transition"
            >
              FAQ
            </a>
          </div>

          {/* Auth buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onGetStarted("signin")}
              className="px-5 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm font-semibold transition-all duration-200 hover:bg-white/20 hover:scale-105 active:scale-95"
            >
              Log In
            </button>
            <button
              onClick={() => onGetStarted("signup")}
              className="px-5 py-2 rounded-full bg-yellow-400 text-indigo-900 text-sm font-bold shadow-md transition-all duration-200 hover:bg-yellow-300 hover:scale-105 hover:shadow-yellow-300/50 hover:shadow-lg active:scale-95"
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative z-10 max-w-3xl mx-auto px-6 pt-8 pb-12 text-center">
        <div className="inline-flex items-center gap-2 mb-5">
          <svg
            viewBox="0 0 20 20"
            fill="none"
            className="w-6 h-6 text-emerald-300"
          >
            <path
              d="M4 10.5l3.5 3.5L16 5"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-white text-lg font-bold tracking-wide uppercase">
            .edu verified
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-[1.03] tracking-tight">
          Meet college students
          <br />
          from around the world.
        </h1>

        <p className="mt-6 text-lg md:text-xl text-white/70 max-w-xl mx-auto">
          Neptune Chat pairs you with a random verified college student for
          live video and text — no profiles, no swiping, just a real
          conversation.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => onGetStarted("signup")}
            className="group px-12 py-5 bg-yellow-400 text-indigo-900 font-extrabold rounded-full shadow-lg transition-all duration-200 hover:bg-yellow-300 hover:scale-105 hover:shadow-yellow-300/60 hover:shadow-2xl active:scale-95 text-xl md:text-2xl"
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
      <section id="about" className="relative z-10 max-w-2xl mx-auto px-6 pb-16 text-center scroll-mt-24">
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
      <section id="how-it-works" className="relative z-10 max-w-4xl mx-auto px-6 pb-16 grid grid-cols-1 md:grid-cols-3 gap-5 scroll-mt-24">
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

      {/* FAQ */}
      <section id="faq" className="relative z-10 max-w-2xl mx-auto px-6 pb-20 scroll-mt-24">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Frequently asked questions
          </h2>
        </div>

        <div className="flex flex-col gap-3">
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