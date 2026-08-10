import { useState, useEffect } from "react";
import Nav from "./Nav";

// Same launch target as the home page — keep these in sync if the date changes.
const LAUNCH_DATE = new Date(2026, 7, 25, 20, 0, 0);

export default function AmbassadorsPage({ onBack, onGetStarted, onApply }) {
  return (
    <div
      className="min-h-screen w-full bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-600 overflow-hidden relative"
      style={{ zoom: 1.2 }}
    >
      {/* Ambient background orbs — matches landing page atmosphere */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-yellow-300/20 blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-[28rem] h-[28rem] rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
      </div>

      {/* Launch countdown — pinned above everything, including nav, same as home page */}
      <LaunchCountdown target={LAUNCH_DATE} />

      {/* Nav — same shared component as the home page. "Video Chat" and the
          logo both take you back home. */}
      <Nav
        onHome={onBack}
        onAmbassadors={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        onGetStarted={onGetStarted}
      />

      {/* Hero */}
      <header className="relative z-10 max-w-3xl mx-auto px-6 pt-8 pb-12 text-center">
        <div className="inline-flex items-center gap-2 mb-5">
          <span className="text-white text-lg font-bold tracking-wide uppercase">
            🔱 Ambassador Program
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-[1.03] tracking-tight">
          Bring Neptune Chat
          <br />
          to your campus
        </h1>

        <p className="mt-6 text-lg md:text-xl text-white/70 max-w-xl mx-auto">
          Ambassadors are the verified students helping other .edu-verified
          students discover Neptune Chat — and getting perks, swag, and early
          access along the way.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => onApply && onApply()}
            className="group px-12 py-5 bg-yellow-400 text-indigo-900 font-extrabold rounded-full shadow-lg transition-all duration-200 hover:bg-yellow-300 hover:scale-105 hover:shadow-yellow-300/60 hover:shadow-2xl active:scale-95 text-xl md:text-2xl"
          >
            <span className="inline-flex items-center gap-3">
              Apply to Be an Ambassador
              <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">
                →
              </span>
            </span>
          </button>
        </div>
      </header>

      {/* Stat strip */}
      <div className="relative z-10 max-w-3xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-3 divide-x divide-white/10 rounded-2xl bg-black/20 border border-white/10 p-6 shadow-2xl backdrop-blur text-center">
          <Stat value="40+" label="Campuses" />
          <Stat value="$250" label="Avg. semester payout" />
          <Stat value="1:1" label="Mentor from our team" />
        </div>
      </div>

      {/* Perks */}
      <section id="perks" className="relative z-10 max-w-4xl mx-auto px-6 pb-16 scroll-mt-24">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            What ambassadors get
          </h2>
          <p className="mt-3 text-white/60 max-w-lg mx-auto text-sm">
            Real perks for helping grow the Neptune Chat community on your
            campus.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <PerkCard
            icon="💵"
            title="Paid per verified signup"
            body="Earn a payout for every new .edu-verified student who signs up through your referral link."
          />
          <PerkCard
            icon="👕"
            title="Exclusive merch"
            body="Ambassador-only hoodies, tees, and stickers to rep on campus — shipped free."
          />
          <PerkCard
            icon="🚀"
            title="Early feature access"
            body="Try new features — like group rooms and interest matching — weeks before public launch."
          />
          <PerkCard
            icon="🎤"
            title="Event budget"
            body="Get funding to host meetups, tabling events, or launch parties at your school."
          />
          <PerkCard
            icon="📄"
            title="Resume-worthy experience"
            body="Real marketing and growth experience, plus a reference from our team when you graduate."
          />
          <PerkCard
            icon="🤝"
            title="Ambassador community"
            body="A private group chat with ambassadors from other schools to swap ideas and wins."
          />
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="relative z-10 max-w-3xl mx-auto px-6 pb-16 scroll-mt-24">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            How it works
          </h2>
        </div>

        <div className="flex flex-col gap-4">
          <StepRow
            number="01"
            title="Apply with your .edu email"
            body="Tell us about your campus and why you'd be a good fit. Takes about two minutes."
          />
          <StepRow
            number="02"
            title="Get your referral link"
            body="Approved ambassadors get a unique link and a starter kit of graphics, flyers, and talking points."
          />
          <StepRow
            number="03"
            title="Share it on campus"
            body="Post it, table with it, drop it in group chats — however it fits your campus best."
          />
          <StepRow
            number="04"
            title="Get paid, monthly"
            body="Track signups in your ambassador dashboard and get paid out every month you're active."
          />
        </div>
      </section>

      {/* Spotlight */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 pb-16">
        <div className="rounded-2xl bg-white/10 border border-white/20 backdrop-blur shadow-xl p-8 md:p-10">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-yellow-300 mb-3">
            Ambassador spotlight
          </span>
          <p className="text-white text-lg md:text-xl font-semibold leading-relaxed">
            "I started tabling outside the dining hall with a QR code and a
            sign-up sheet. Three weeks in, half my floor had Neptune Chat on
            their phone."
          </p>
          <p className="mt-4 text-white/60 text-sm">
            — Ambassador, Big Ten campus
          </p>
        </div>
      </section>

      {/* Apply / requirements */}
      <section id="apply" className="relative z-10 max-w-2xl mx-auto px-6 pb-20 scroll-mt-24">
        <div className="rounded-2xl bg-white/10 border border-white/20 backdrop-blur shadow-xl p-8 md:p-10 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Think you'd be a great fit?
          </h2>
          <p className="mt-3 text-white/70 text-sm md:text-base max-w-md mx-auto">
            We're looking for current, .edu-verified students who are active
            on campus and comfortable talking to new people. No marketing
            experience required.
          </p>

          <ul className="mt-6 flex flex-col gap-2 text-left max-w-sm mx-auto">
            <Requirement text="Currently enrolled with a verified .edu email" />
            <Requirement text="Active in at least one campus community or org" />
            <Requirement text="Available for a semester-long commitment" />
          </ul>

          <button
            onClick={() => onApply && onApply()}
            className="mt-8 px-10 py-4 rounded-full bg-yellow-400 text-indigo-900 font-extrabold shadow-md transition-all duration-200 hover:bg-yellow-300 hover:scale-105 hover:shadow-yellow-300/50 hover:shadow-lg active:scale-95"
          >
            Start Application →
          </button>
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

function Stat({ value, label }) {
  return (
    <div className="px-2">
      <p className="text-2xl md:text-3xl font-extrabold text-yellow-300">
        {value}
      </p>
      <p className="mt-1 text-white/60 text-xs font-semibold uppercase tracking-wide">
        {label}
      </p>
    </div>
  );
}

function PerkCard({ icon, title, body }) {
  return (
    <div className="rounded-2xl bg-white/10 border border-white/20 backdrop-blur p-6 text-left transition-all duration-200 hover:bg-white/15 hover:border-white/30 hover:-translate-y-1">
      <span className="text-3xl">{icon}</span>
      <h3 className="mt-3 text-white font-bold text-lg">{title}</h3>
      <p className="mt-1.5 text-white/70 text-sm leading-relaxed">{body}</p>
    </div>
  );
}

function StepRow({ number, title, body }) {
  return (
    <div className="flex items-start gap-4 rounded-xl bg-white/10 border border-white/20 backdrop-blur p-5 transition-all duration-200 hover:bg-white/[0.14]">
      <span className="shrink-0 text-yellow-300 font-extrabold text-lg tracking-tight w-10">
        {number}
      </span>
      <div>
        <h3 className="text-white font-bold text-base">{title}</h3>
        <p className="mt-1 text-white/70 text-sm leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

function Requirement({ text }) {
  return (
    <li className="flex items-center gap-3 text-white/80 text-sm">
      <svg
        viewBox="0 0 20 20"
        fill="none"
        className="w-5 h-5 text-emerald-300 shrink-0"
      >
        <path
          d="M4 10.5l3.5 3.5L16 5"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {text}
    </li>
  );
}

// Same LED countdown strip as the home page — kept byte-for-byte identical
// (styles, digit sizes, glow) so the two pages read as one continuous site.
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

        <div className="flex items-center rounded-md bg-black/40 border border-yellow-300/20 px-2.5 sm:px-3 py-1 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
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