import { useEffect, useMemo, useState } from "react";
import Nav from "./Nav";
import Footer from "./Footer";

const FAQS = [
  {
    question: "What is Neptune Chat?",
    answer:
      "Neptune Chat is a random video and text chat platform built for college students. Students verify an eligible college email before entering the community.",
  },
  {
    question: "Is Neptune Chat an Omegle alternative for college students?",
    answer:
      "Yes. Neptune Chat keeps the spontaneous random-chat experience while focusing specifically on college students rather than the general internet.",
  },
  {
    question: "Do I need a college email?",
    answer:
      "Yes. Neptune Chat requires an eligible college or university email before you can start chatting.",
  },
  {
    question: "Can I video chat and text?",
    answer:
      "Yes. Neptune Chat supports live video conversations and text chat.",
  },
  {
    question: "Can I skip someone?",
    answer:
      "Yes. You can move on from a conversation and enter another random match.",
  },
  {
    question: "When is Neptune Chat open?",
    answer:
      "Neptune Chat currently runs nightly from 8:00 PM to 3:00 AM Eastern Time.",
  },
];

export default function OmegleAlternative({
  onHome,
  onAmbassadors,
  onGetStarted,
}) {
  useSEO();

  return (
    <div
      className="min-h-screen w-full overflow-hidden relative text-white"
      style={{
        minHeight: "100vh",
        zoom: 1.2,

        // Explicit fallback so this NEVER becomes a white page.
        background:
          "linear-gradient(135deg, #4f46e5 0%, #7c3aed 48%, #2563eb 100%)",
      }}
    >
      <NeptuneStyles />

      {/* SAME AMBIENT BACKGROUND STYLE AS LANDING PAGE */}
      <AmbientOrbs />
      <ScatteredCrests />
      <StarField />

      {/* NAV */}
      <Nav
        onHome={() => {
          if (onHome) {
            onHome();
          } else {
            window.location.href = "/";
          }
        }}
        onAmbassadors={onAmbassadors}
        onGetStarted={onGetStarted}
      />

      <main className="relative z-10">
        {/* ====================================================== */}
        {/* BREADCRUMB */}
        {/* ====================================================== */}

        <div className="max-w-4xl mx-auto px-6 pt-4">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center justify-center sm:justify-start gap-2 text-xs text-white/45"
          >
            <a
              href="/"
              className="hover:text-yellow-300 transition-colors"
            >
              Neptune Chat
            </a>

            <span>›</span>

            <span className="text-white/70">
              Omegle Alternative
            </span>
          </nav>
        </div>

        {/* ====================================================== */}
        {/* HERO */}
        {/* ====================================================== */}

        <header className="max-w-4xl mx-auto px-6 pt-12 pb-14 text-center">
          <div
            className="
              inline-flex
              items-center
              gap-2
              rounded-full
              bg-black/25
              border
              border-emerald-300/30
              backdrop-blur
              px-4
              py-1.5
              mb-6
            "
            style={{
              boxShadow:
                "0 0 16px rgba(52,211,153,0.35)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.9)]" />

            <span className="text-white/80 text-[11px] font-bold uppercase tracking-widest">
              College Student Verified
            </span>
          </div>

          <h1
            className="
              text-5xl
              md:text-7xl
              font-extrabold
              text-white
              leading-[1.03]
              tracking-tight
            "
            style={{
              textShadow:
                "0 0 30px rgba(253,224,71,0.25), 0 0 60px rgba(165,180,252,0.2)",
            }}
          >
            An Omegle alternative
            <br />

            <span className="text-yellow-300">
              for college students
            </span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            Neptune Chat is a random video chat platform built specifically
            for college students. Meet another verified student through live
            video and text — no profiles, no swiping, just a real
            conversation.
          </p>

          <p className="mt-3 text-white/50 text-sm">
            Live nightly, 8 PM–3 AM ET.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() =>
                onGetStarted && onGetStarted("signup")
              }
              className="
                group
                px-12
                py-5
                bg-yellow-400
                text-indigo-900
                font-extrabold
                rounded-full
                shadow-lg
                transition-all
                duration-200
                hover:bg-yellow-300
                hover:scale-105
                active:scale-95
                text-xl
              "
              style={{
                boxShadow:
                  "0 0 24px rgba(253,224,71,0.5), 0 0 60px rgba(253,224,71,0.22)",
              }}
            >
              Start Video Chat

              <span className="inline-block ml-3 transition-transform duration-200 group-hover:translate-x-1">
                →
              </span>
            </button>

            <a
              href="#how-it-works"
              className="
                px-8
                py-4
                rounded-full
                bg-white/10
                border
                border-white/20
                backdrop-blur
                text-white
                font-bold
                hover:bg-white/15
                transition
              "
            >
              How It Works
            </a>
          </div>
        </header>

        {/* ====================================================== */}
        {/* VIDEO PREVIEW */}
        {/* ====================================================== */}

        <section className="max-w-3xl mx-auto px-6 pb-16">
          <div
            className="
              flex
              gap-3
              rounded-2xl
              bg-black/20
              border
              border-white/10
              p-3
              shadow-2xl
              backdrop-blur
            "
          >
            <div className="flex-1 aspect-video rounded-xl bg-slate-900/80 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl mb-2">👋</div>

                <span className="text-white/30 text-sm font-medium">
                  You
                </span>
              </div>
            </div>

            <div className="flex-1 aspect-video rounded-xl bg-slate-900/80 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl mb-2">🎓</div>

                <span className="text-white/30 text-sm font-medium">
                  A random neptuner
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================== */}
        {/* WHAT IS NEPTUNE */}
        {/* ====================================================== */}

        <section className="max-w-3xl mx-auto px-6 pb-16 text-center">
          <span className="text-yellow-300 text-xs font-extrabold uppercase tracking-widest">
            What is Neptune Chat?
          </span>

          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Random video chat built for college students
          </h2>

          <p className="mt-5 text-white/70 leading-relaxed text-base md:text-lg">
            Neptune Chat randomly connects college students for live
            one-on-one conversations. Instead of opening random chat to the
            entire internet, Neptune Chat is built around a verified college
            student community.
          </p>

          <p className="mt-4 text-white/65 leading-relaxed">
            Students verify an eligible college email, enter the chat queue,
            and get paired with another available student.
          </p>
        </section>

        {/* ====================================================== */}
        {/* WHY AN OMEGLE ALTERNATIVE */}
        {/* ====================================================== */}

        <section className="max-w-4xl mx-auto px-6 pb-16">
          <div className="text-center mb-8">
            <span className="text-yellow-300 text-xs font-extrabold uppercase tracking-widest">
              A different random chat experience
            </span>

            <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Why a college-focused Omegle alternative?
            </h2>

            <p className="mt-4 text-white/60 max-w-2xl mx-auto">
              Neptune Chat keeps the spontaneity of random chat while
              narrowing the community around students.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            <FeatureCard
              icon="🎓"
              title="College students"
              body="Neptune Chat is designed specifically around the college community."
            />

            <FeatureCard
              icon="⚡"
              title="Instant conversations"
              body="Skip profiles and swiping. Enter the queue and start talking."
            />

            <FeatureCard
              icon="🌎"
              title="Meet someone new"
              body="Random matching can introduce you to someone outside your normal social circle."
            />
          </div>
        </section>

        {/* ====================================================== */}
        {/* HOW IT WORKS */}
        {/* ====================================================== */}

        <section
          id="how-it-works"
          className="relative z-10 max-w-4xl mx-auto px-6 pb-16 scroll-mt-24"
        >
          <div className="text-center mb-8">
            <span className="text-yellow-300 text-xs font-extrabold uppercase tracking-widest">
              How it works
            </span>

            <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-white">
              Meet another student in seconds
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            <StepCard
              number="1"
              title="Create an account"
              body="Sign up for Neptune Chat using your student information."
            />

            <StepCard
              number="2"
              title="Verify your college email"
              body="Verify an eligible college or university email before entering the student community."
            />

            <StepCard
              number="3"
              title="Start chatting"
              body="Enter the queue and get randomly paired with another available college student."
            />
          </div>
        </section>

        {/* ====================================================== */}
        {/* COMPARISON */}
        {/* ====================================================== */}

        <section className="relative z-10 max-w-3xl mx-auto px-6 pb-16">
          <div className="text-center mb-8">
            <span className="text-yellow-300 text-xs font-extrabold uppercase tracking-widest">
              The difference
            </span>

            <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-white">
              Neptune Chat vs. general random chat
            </h2>
          </div>

          <div
            className="
              rounded-2xl
              bg-white/10
              border
              border-white/20
              backdrop-blur
              shadow-xl
              overflow-hidden
            "
          >
            <ComparisonRow
              label="Community"
              neptune="College students"
              other="General internet"
            />

            <ComparisonRow
              label="College email verification"
              neptune="Required"
              other="Not college-specific"
            />

            <ComparisonRow
              label="Random matching"
              neptune="Included"
              other="Common"
            />

            <ComparisonRow
              label="Video chat"
              neptune="Included"
              other="Common"
            />

            <ComparisonRow
              label="Text chat"
              neptune="Included"
              other="Common"
            />

            <ComparisonRow
              label="Profiles + swiping"
              neptune="Not required"
              other="Varies"
              last
            />
          </div>
        </section>

        {/* ====================================================== */}
        {/* NOT A DATING APP */}
        {/* ====================================================== */}

        <section className="relative z-10 max-w-4xl mx-auto px-6 pb-16">
          <div className="grid md:grid-cols-2 gap-5">
            <InfoCard
              label="Conversation first"
              title="Not another swipe-based app"
            >
              Neptune Chat starts with a conversation rather than a profile.
              You don't need to browse pictures or swipe through people
              before talking to somebody new.
            </InfoCard>

            <InfoCard
              label="Random matching"
              title="You don't choose the introduction"
            >
              Enter the queue and Neptune randomly pairs you with another
              available student. If the conversation isn't for you, move on
              and meet someone else.
            </InfoCard>
          </div>
        </section>

        {/* ====================================================== */}
        {/* SAFETY */}
        {/* ====================================================== */}

        <section
          id="safety"
          className="relative z-10 max-w-3xl mx-auto px-6 pb-16"
        >
          <div
            className="
              rounded-2xl
              bg-white/10
              border
              border-white/20
              backdrop-blur
              shadow-xl
              p-8
              md:p-10
            "
          >
            <div className="flex flex-col md:flex-row gap-7 items-start">
              <div className="text-4xl">🛡️</div>

              <div>
                <span className="text-yellow-300 text-xs font-extrabold uppercase tracking-widest">
                  Community & safety
                </span>

                <h2 className="mt-2 text-2xl md:text-3xl font-extrabold text-white">
                  Built around a student community
                </h2>

                <p className="mt-4 text-white/70 leading-relaxed">
                  Neptune Chat requires an eligible college email before a
                  student can enter the chat community. You can leave a
                  conversation at any time and move to another match.
                </p>

                <p className="mt-4 text-white/60 leading-relaxed">
                  As with any online conversation, never share passwords,
                  financial information, your home address, or other sensitive
                  personal information with someone you just met.
                </p>

                <a
                  href="/safety"
                  className="inline-flex mt-5 text-yellow-300 font-bold hover:text-yellow-200 transition-colors"
                >
                  Learn more about safety →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================== */}
        {/* FAQ */}
        {/* ====================================================== */}

        <section
          id="faq"
          className="relative z-10 max-w-2xl mx-auto px-6 pb-20 scroll-mt-24"
        >
          <div className="text-center mb-8">
            <span className="text-yellow-300 text-xs font-extrabold uppercase tracking-widest">
              Questions
            </span>

            <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-white">
              Omegle alternative FAQ
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            {FAQS.map((faq) => (
              <FaqItem
                key={faq.question}
                question={faq.question}
                answer={faq.answer}
              />
            ))}
          </div>
        </section>

        {/* ====================================================== */}
        {/* FINAL CTA */}
        {/* ====================================================== */}

        <section className="relative z-10 max-w-3xl mx-auto px-6 pb-20">
          <div
            className="
              rounded-3xl
              bg-yellow-400
              p-8
              md:p-10
              text-center
            "
            style={{
              boxShadow:
                "0 0 35px rgba(253,224,71,0.3)",
            }}
          >
            <span className="text-indigo-900/60 text-xs font-extrabold uppercase tracking-widest">
              Meet someone new
            </span>

            <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-indigo-950">
              Try Neptune Chat
            </h2>

            <p className="mt-4 max-w-xl mx-auto text-indigo-950/70">
              Join a random video chat community built specifically for
              college students.
            </p>

            <button
              type="button"
              onClick={() =>
                onGetStarted && onGetStarted("signup")
              }
              className="
                mt-6
                px-9
                py-4
                rounded-full
                bg-indigo-700
                text-white
                font-extrabold
                transition-all
                hover:bg-indigo-800
                hover:scale-105
                active:scale-95
              "
            >
              Sign Up →
            </button>
          </div>
        </section>
      </main>

      {/* ====================================================== */}
      {/* SHARED SITE FOOTER */}
      {/* ====================================================== */}

      <Footer
        onHome={onHome}
        onAmbassadors={onAmbassadors}
        onGetStarted={onGetStarted}
      />
    </div>
  );
}

/* ========================================================= */
/* FEATURE CARD */
/* ========================================================= */

function FeatureCard({ icon, title, body }) {
  return (
    <article
      className="
        rounded-2xl
        bg-white/10
        border
        border-white/20
        backdrop-blur
        p-6
        text-left
        transition-all
        duration-200
        hover:bg-white/15
        hover:border-white/30
        hover:-translate-y-1
      "
    >
      <span className="text-3xl">
        {icon}
      </span>

      <h3 className="mt-3 text-white font-bold text-lg">
        {title}
      </h3>

      <p className="mt-1.5 text-white/70 text-sm leading-relaxed">
        {body}
      </p>
    </article>
  );
}

/* ========================================================= */
/* STEP */
/* ========================================================= */

function StepCard({ number, title, body }) {
  return (
    <article
      className="
        rounded-2xl
        bg-white/10
        border
        border-white/20
        backdrop-blur
        p-6
      "
    >
      <div
        className="
          w-10
          h-10
          rounded-full
          bg-yellow-400
          text-indigo-900
          font-extrabold
          flex
          items-center
          justify-center
        "
        style={{
          boxShadow:
            "0 0 14px rgba(253,224,71,0.4)",
        }}
      >
        {number}
      </div>

      <h3 className="mt-4 text-white text-lg font-bold">
        {title}
      </h3>

      <p className="mt-2 text-white/65 text-sm leading-relaxed">
        {body}
      </p>
    </article>
  );
}

/* ========================================================= */
/* COMPARISON */
/* ========================================================= */

function ComparisonRow({
  label,
  neptune,
  other,
  last = false,
}) {
  return (
    <div
      className={`
        grid
        grid-cols-[1.2fr_1fr_1fr]
        gap-3
        px-5
        py-4
        text-sm
        ${
          last
            ? ""
            : "border-b border-white/10"
        }
      `}
    >
      <span className="text-white/80 font-semibold">
        {label}
      </span>

      <span className="text-emerald-300 font-semibold">
        {neptune}
      </span>

      <span className="text-white/45">
        {other}
      </span>
    </div>
  );
}

/* ========================================================= */
/* INFO CARD */
/* ========================================================= */

function InfoCard({
  label,
  title,
  children,
}) {
  return (
    <article
      className="
        rounded-2xl
        bg-white/10
        border
        border-white/20
        backdrop-blur
        p-7
      "
    >
      <span className="text-yellow-300 text-xs font-extrabold uppercase tracking-widest">
        {label}
      </span>

      <h3 className="mt-3 text-2xl text-white font-extrabold">
        {title}
      </h3>

      <p className="mt-4 text-white/70 leading-relaxed">
        {children}
      </p>
    </article>
  );
}

/* ========================================================= */
/* FAQ */
/* ========================================================= */

function FaqItem({
  question,
  answer,
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`
        rounded-xl
        border
        backdrop-blur
        overflow-hidden
        transition-all
        duration-300
        ${
          open
            ? "bg-white/15 border-yellow-300/40 shadow-lg"
            : "bg-white/10 border-white/20 hover:bg-white/[0.13]"
        }
      `}
    >
      <button
        type="button"
        onClick={() =>
          setOpen((value) => !value)
        }
        className="
          w-full
          flex
          items-center
          justify-between
          gap-4
          px-5
          py-4
          text-left
        "
      >
        <span
          className={`font-semibold text-sm md:text-base ${
            open
              ? "text-yellow-300"
              : "text-white"
          }`}
        >
          {question}
        </span>

        <span
          className={`
            shrink-0
            flex
            items-center
            justify-center
            w-7
            h-7
            rounded-full
            transition-all
            duration-300
            ${
              open
                ? "bg-yellow-400 rotate-[135deg]"
                : "bg-white/10"
            }
          `}
        >
          <span
            className={`text-lg ${
              open
                ? "text-indigo-900"
                : "text-yellow-300"
            }`}
          >
            +
          </span>
        </span>
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-300"
        style={{
          gridTemplateRows:
            open ? "1fr" : "0fr",
        }}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-4 pt-3 border-t border-white/10 text-white/70 text-sm leading-relaxed">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ========================================================= */
/* AMBIENT BACKGROUND */
/* ========================================================= */

function AmbientOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-yellow-300/20 blur-3xl"
        style={{
          animation:
            "orbDrift 22s ease-in-out infinite",
        }}
      />

      <div
        className="absolute top-1/3 -right-32 w-[28rem] h-[28rem] rounded-full bg-cyan-300/10 blur-3xl"
        style={{
          animation:
            "orbDrift 28s ease-in-out infinite reverse",
        }}
      />

      <div
        className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-white/10 blur-3xl"
        style={{
          animation:
            "orbDrift 18s ease-in-out infinite",
        }}
      />

      <div
        className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-pink-300/10 blur-3xl"
        style={{
          animation:
            "orbDrift 24s ease-in-out infinite reverse",
        }}
      />
    </div>
  );
}

/* ========================================================= */
/* CAMPUS SYMBOLS */
/* ========================================================= */

const CAMPUS_ICONS = [
  "🎓",
  "Σ",
  "🎓",
  "Δ",
  "🏛️",
  "Ω",
  "🎓",
  "Φ",
  "📜",
  "Θ",
  "🎓",
  "Π",
];

function ScatteredCrests() {
  const placements = useMemo(
    () => [
      { top: "4%", left: "4%", size: "text-6xl", rot: -12 },
      { top: "8%", left: "82%", size: "text-5xl", rot: 8 },
      { top: "18%", left: "12%", size: "text-4xl", rot: 10 },
      { top: "23%", left: "91%", size: "text-5xl", rot: -10 },
      { top: "35%", left: "5%", size: "text-5xl", rot: 12 },
      { top: "42%", left: "87%", size: "text-6xl", rot: -8 },
      { top: "52%", left: "16%", size: "text-4xl", rot: -6 },
      { top: "59%", left: "93%", size: "text-5xl", rot: 10 },
      { top: "68%", left: "7%", size: "text-6xl", rot: 8 },
      { top: "76%", left: "84%", size: "text-4xl", rot: -12 },
      { top: "86%", left: "17%", size: "text-5xl", rot: 8 },
      { top: "92%", left: "77%", size: "text-5xl", rot: -6 },
    ],
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      {placements.map((placement, index) => (
        <span
          key={index}
          className={`absolute font-extrabold text-yellow-100 ${placement.size}`}
          style={{
            top: placement.top,
            left: placement.left,
            opacity: 0.42,
            transform: `rotate(${placement.rot}deg)`,
            animation: `floatSlow ${
              14 + (index % 7)
            }s ease-in-out infinite`,
            filter:
              "drop-shadow(0 0 6px rgba(253,224,71,0.45))",
          }}
        >
          {
            CAMPUS_ICONS[
              index %
                CAMPUS_ICONS.length
            ]
          }
        </span>
      ))}
    </div>
  );
}

/* ========================================================= */
/* STARS */
/* ========================================================= */

function StarField() {
  const stars = useMemo(() => {
    const result = [];

    for (let i = 0; i < 48; i++) {
      result.push({
        top: `${
          (i * 23 +
            (i % 5) * 11) %
          100
        }%`,
        left: `${
          (i * 41 +
            (i % 7) * 9) %
          100
        }%`,
        delay: `${
          (i % 9) * 0.35
        }s`,
        duration: `${
          2.5 + (i % 5)
        }s`,
      });
    }

    return result;
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map(
        (star, index) => (
          <span
            key={index}
            className="absolute w-1 h-1 rounded-full bg-white"
            style={{
              top: star.top,
              left: star.left,
              animation: `twinkle ${star.duration} ease-in-out ${star.delay} infinite`,
            }}
          />
        )
      )}
    </div>
  );
}

/* ========================================================= */
/* SEO */
/* ========================================================= */

function useSEO() {
  useEffect(() => {
    const title =
      "Omegle Alternative for College Students | Neptune Chat";

    const description =
      "Neptune Chat is an Omegle alternative built for college students. Meet verified students through random video and text chat.";

    document.title = title;

    setMeta(
      "description",
      description
    );

    setMeta(
      "robots",
      "index, follow"
    );

    setProperty(
      "og:title",
      title
    );

    setProperty(
      "og:description",
      description
    );

    setProperty(
      "og:type",
      "website"
    );

    setProperty(
      "og:url",
      "https://neptunechat.app/omegle-alternative"
    );

    setMeta(
      "twitter:card",
      "summary_large_image"
    );

    let canonical =
      document.querySelector(
        'link[rel="canonical"]'
      );

    if (!canonical) {
      canonical =
        document.createElement(
          "link"
        );

      canonical.rel =
        "canonical";

      document.head.appendChild(
        canonical
      );
    }

    canonical.href =
      "https://neptunechat.app/omegle-alternative";

    const existing =
      document.getElementById(
        "omegle-page-schema"
      );

    if (existing) {
      existing.remove();
    }

    const schema =
      document.createElement(
        "script"
      );

    schema.type =
      "application/ld+json";

    schema.id =
      "omegle-page-schema";

    schema.textContent =
      JSON.stringify({
        "@context":
          "https://schema.org",

        "@graph": [
          {
            "@type":
              "WebPage",

            name: title,

            url:
              "https://neptunechat.app/omegle-alternative",

            description,
          },

          {
            "@type":
              "Organization",

            name:
              "Neptune Chat",

            legalName:
              "The Neptune Way LLC",

            url:
              "https://neptunechat.app/",

            description:
              "Neptune Chat is a random video chat platform designed for college students.",
          },

          {
            "@type":
              "FAQPage",

            mainEntity:
              FAQS.map(
                (faq) => ({
                  "@type":
                    "Question",

                  name:
                    faq.question,

                  acceptedAnswer:
                    {
                      "@type":
                        "Answer",

                      text:
                        faq.answer,
                    },
                })
              ),
          },
        ],
      });

    document.head.appendChild(
      schema
    );

    return () => {
      const old =
        document.getElementById(
          "omegle-page-schema"
        );

      if (old) {
        old.remove();
      }
    };
  }, []);
}

function setMeta(
  name,
  content
) {
  let element =
    document.querySelector(
      `meta[name="${name}"]`
    );

  if (!element) {
    element =
      document.createElement(
        "meta"
      );

    element.setAttribute(
      "name",
      name
    );

    document.head.appendChild(
      element
    );
  }

  element.setAttribute(
    "content",
    content
  );
}

function setProperty(
  property,
  content
) {
  let element =
    document.querySelector(
      `meta[property="${property}"]`
    );

  if (!element) {
    element =
      document.createElement(
        "meta"
      );

    element.setAttribute(
      "property",
      property
    );

    document.head.appendChild(
      element
    );
  }

  element.setAttribute(
    "content",
    content
  );
}

/* ========================================================= */
/* ANIMATIONS */
/* ========================================================= */

function NeptuneStyles() {
  return (
    <style>{`
      html {
        scroll-behavior: smooth;
      }

      @keyframes twinkle {
        0%, 100% {
          opacity: 0.15;
          transform: scale(0.85);
        }

        50% {
          opacity: 0.9;
          transform: scale(1.1);
        }
      }

      @keyframes floatSlow {
        0%, 100% {
          transform: translateY(0px);
        }

        50% {
          transform: translateY(-14px);
        }
      }

      @keyframes orbDrift {
        0%, 100% {
          transform: translate(0px, 0px) scale(1);
        }

        33% {
          transform: translate(30px, -40px) scale(1.08);
        }

        66% {
          transform: translate(-25px, 25px) scale(0.95);
        }
      }
    `}</style>
  );
}