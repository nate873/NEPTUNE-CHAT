import { useState } from "react";

export default function LandingPage({ onGetStarted }) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-600 overflow-hidden relative">
      {/* Ambient background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-yellow-300/20 blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-[28rem] h-[28rem] rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-10 py-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔱</span>
          <span className="text-white font-bold text-lg tracking-tight">
            Neptune Chat
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onGetStarted("signin")}
            className="px-5 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm font-semibold hover:bg-white/20 transition"
          >
            Log In
          </button>
          <button
            onClick={() => onGetStarted("signup")}
            className="px-5 py-2 rounded-full bg-yellow-400 text-indigo-900 text-sm font-bold hover:bg-yellow-300 transition"
          >
            Sign Up
          </button>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative z-10 max-w-4xl mx-auto px-6 pt-14 pb-20 text-center">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-semibold tracking-wide uppercase mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          .edu verified — college students only
        </span>

        <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-[1.05] tracking-tight">
          Meet someone new
          <br />
          on campus, right now.
        </h1>

        <p className="mt-6 text-lg text-white/70 max-w-xl mx-auto">
          Neptune Chat pairs you with a random verified college student for
          live video and text — no profiles, no swiping, just a real
          conversation.
        </p>

        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => onGetStarted("signup")}
            className="px-8 py-3.5 bg-yellow-400 text-indigo-900 font-bold rounded-full shadow-lg hover:bg-yellow-300 hover:shadow-yellow-300/50 transition text-base"
          >
            Start Chatting →
          </button>
          <span className="text-white/50 text-sm">
            Free · Verify with your .edu email
          </span>
        </div>
      </header>

      {/* Preview mock — stand-in for the real video panels */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 pb-24">
        <div className="flex gap-3 rounded-2xl bg-black/20 border border-white/10 p-3 shadow-2xl backdrop-blur">
          <div className="flex-1 aspect-video rounded-xl bg-slate-900/80 flex items-center justify-center">
            <span className="text-white/30 text-sm font-medium">You</span>
          </div>
          <div className="flex-1 aspect-video rounded-xl bg-slate-900/80 flex items-center justify-center">
            <span className="text-white/30 text-sm font-medium">
              A random Neptune
            </span>
          </div>
        </div>
      </div>

      {/* Features */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-24 grid grid-cols-1 md:grid-cols-3 gap-5">
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
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-24">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Why Neptune Chat is different
          </h2>
          <p className="mt-3 text-white/60 max-w-lg mx-auto text-sm">
            Built specifically for verified college students, not the open
            internet.
          </p>
        </div>

        <p className="text-white/70 text-sm max-w-2xl mx-auto text-center mb-6 leading-relaxed">
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
                  neptune={true}
                  others={[false, false, false]}
                />
                <ComparisonRow
                  label="Age-verified accounts"
                  neptune={true}
                  others={[false, false, false]}
                />
                <ComparisonRow
                  label="Password-protected login"
                  neptune={true}
                  others={[false, false, false]}
                />
                <ComparisonRow
                  label="Video + text together"
                  neptune={true}
                  others={[true, true, true]}
                />
                <ComparisonRow
                  label="Instant re-match"
                  neptune={true}
                  others={[true, true, true]}
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
      <section className="relative z-10 max-w-3xl mx-auto px-6 pb-28">
        <div className="text-center mb-10">
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
          Neptune Chat is for currently enrolled college students. Be kind.
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, body }) {
  return (
    <div className="rounded-2xl bg-white/10 border border-white/20 backdrop-blur p-6 text-left">
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

function Mark({ value, highlight }) {
  if (value) {
    return (
      <span
        className={
          highlight
            ? "text-emerald-300 font-semibold"
            : "text-emerald-300/70 font-medium"
        }
      >
        Yes
      </span>
    );
  }
  return <span className="text-rose-300/70 font-medium">No</span>;
}

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl bg-white/10 border border-white/20 backdrop-blur overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-white font-semibold text-sm md:text-base">
          {question}
        </span>
        <span
          className={`text-yellow-300 text-xl leading-none transition-transform ${
            open ? "rotate-45" : ""
          }`}
        >
          +
        </span>
      </button>
      {open && (
        <div className="px-5 pb-4 text-white/70 text-sm leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}