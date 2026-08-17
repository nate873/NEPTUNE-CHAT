import { useEffect, useRef, useState, useMemo } from "react";
import { supabase } from "./supabaseClient";

const RESEND_COOLDOWN_SECONDS = 45;

// Same school set used across the landing page and chat room — keep these
// three lists in sync if you add/remove a university.
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

// Shown as a grid of pills on the "details" step.
const CLASS_YEARS = ["Freshman", "Sophomore", "Junior", "Senior", "Grad Student"];

export default function EduAuth({ onVerified, initialMode = "signin" }) {
  const [mode, setMode] = useState(initialMode); // signin | signup
  // email | code | password | university | details | username
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [university, setUniversity] = useState(""); // UNIVERSITIES[].id
  const [major, setMajor] = useState("");
  const [classYear, setClassYear] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownIntervalRef = useRef(null);

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(value.trim());
  }

  function resetToStart(newMode) {
    setMode(newMode);
    setStep("email");
    setCode("");
    setPassword("");
    setConfirmPassword("");
    setUniversity("");
    setMajor("");
    setClassYear("");
    setUsername("");
    setError("");
    stopCooldown();
  }

  function stopCooldown() {
    if (cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
      cooldownIntervalRef.current = null;
    }
    setResendCooldown(0);
  }

  function startCooldown() {
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    cooldownIntervalRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownIntervalRef.current);
          cooldownIntervalRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    };
  }, []);

  // ---- SIGN IN (returning users) ----
  async function handleSignIn(e) {
    e.preventDefault();
    setError("");

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    onVerified(data.session);
  }

  // ---- SIGN UP step 1: send code ----
  // Note: Supabase silently uses a different email template (confirmation vs.
  // recovery/magic-link) depending on whether this address already has an
  // account, without telling the client which one fired. Repeated clicks on
  // this button are the most common way to accidentally flip between the
  // two, so we throttle it client-side with a cooldown instead of relying on
  // people to naturally wait between attempts.
  async function sendCode(e) {
    e.preventDefault();
    setError("");

    if (resendCooldown > 0) return;

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    startCooldown();
    setStep("code");
  }

  async function resendCode() {
    if (resendCooldown > 0 || loading) return;
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    startCooldown();
  }

  // ---- SIGN UP step 2: verify code ----
  async function verifyCode(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    stopCooldown();
    // Verified — now have them set a password for future logins
    setStep("password");
  }

  // ---- SIGN UP step 3: set password ----
  async function setAccountPassword(e) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // Password set — now have them pick their university
    setStep("university");
  }

  // ---- SIGN UP step 4: pick a university ----
  async function setUniversityAndContinue(e) {
    e.preventDefault();
    setError("");

    if (!university) {
      setError("Please select your university.");
      return;
    }

    const school = UNIVERSITIES.find((u) => u.id === university);

    setLoading(true);
    // Stored so the match filter (and any future "students at your school"
    // features) can read it straight off the user's session/profile.
    const { error } = await supabase.auth.updateUser({
      data: { university: school.id, university_name: school.name },
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // University set — now have them fill in major + year
    setStep("details");
  }

  // ---- SIGN UP step 5: major + class year ----
  async function setDetailsAndContinue(e) {
    e.preventDefault();
    setError("");

    const trimmedMajor = major.trim();
    if (trimmedMajor.length < 2 || trimmedMajor.length > 40) {
      setError("Enter your major (2–40 characters).");
      return;
    }
    if (!classYear) {
      setError("Please select your year.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      data: { major: trimmedMajor, class_year: classYear },
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // Details set — now have them pick a username before entering
    setStep("username");
  }

  // ---- SIGN UP step 6: choose a username ----
  async function setUsernameAndEnter(e) {
    e.preventDefault();
    setError("");

    const trimmed = username.trim();
    if (trimmed.length < 3 || trimmed.length > 20) {
      setError("Username must be between 3 and 20 characters.");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setError("Username can only contain letters, numbers, and underscores — no spaces.");
      return;
    }

    setLoading(true);
    // Stored under both `username` (new) and `display_name` (kept for
    // backward compatibility with anything still reading the old field,
    // e.g. older accounts / other components).
    const { error } = await supabase.auth.updateUser({
      data: { username: trimmed, display_name: trimmed },
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    onVerified(sessionData.session);
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-600 flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.15; transform: scale(0.85); }
          50% { opacity: 0.9; transform: scale(1.1); }
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
        @keyframes borderGlow {
          0%, 100% { box-shadow: 0 0 40px rgba(253,224,71,0.25), 0 0 80px rgba(99,102,241,0.3), 0 25px 50px -12px rgba(0,0,0,0.4); }
          50% { box-shadow: 0 0 60px rgba(253,224,71,0.4), 0 0 100px rgba(99,102,241,0.45), 0 25px 50px -12px rgba(0,0,0,0.4); }
        }
      `}</style>

      {/* Ambient background orbs — same atmosphere as the rest of the site, toned down for a small card */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-yellow-300/25 blur-3xl"
          style={{ animation: "orbDrift 22s ease-in-out infinite" }}
        />
        <div
          className="absolute top-1/3 -right-32 w-[28rem] h-[28rem] rounded-full bg-cyan-300/15 blur-3xl"
          style={{ animation: "orbDrift 28s ease-in-out infinite reverse" }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-white/15 blur-3xl"
          style={{ animation: "orbDrift 18s ease-in-out infinite" }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-pink-300/15 blur-3xl"
          style={{ animation: "orbDrift 24s ease-in-out infinite reverse" }}
        />
      </div>

      {/* Scattered campus/Greek-life iconography — fewer + smaller than the landing page so it stays quiet behind a small card */}
      <ScatteredCrests />

      {/* Twinkling star field */}
      <StarField />

      <div
        className="relative z-10 w-full max-w-sm bg-white/10 backdrop-blur border border-yellow-300/30 rounded-2xl p-8"
        style={{ animation: "borderGlow 4s ease-in-out infinite" }}
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <NeptuneIcon size={26} />
          <h1
            className="text-2xl font-extrabold text-white text-center"
            style={{ textShadow: "0 0 20px rgba(165,180,252,0.5)" }}
          >
            Neptune Chat
          </h1>
        </div>
        <p className="text-white/70 text-center text-sm mb-6">
          Verify your email to continue
        </p>

        {/* Mode toggle */}
        <div className="flex mb-6 bg-white/10 rounded-full p-1">
          <button
            type="button"
            onClick={() => resetToStart("signin")}
            className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${
              mode === "signin"
                ? "bg-yellow-400 text-indigo-900"
                : "text-white/70"
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => resetToStart("signup")}
            className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${
              mode === "signup"
                ? "bg-yellow-400 text-indigo-900"
                : "text-white/70"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Step progress — only during signup, gives a sense of how much is left */}
        {mode === "signup" && (
          <StepProgress
            step={step}
            steps={["email", "code", "password", "university", "details", "username"]}
          />
        )}

        {/* ---- SIGN IN ---- */}
        {mode === "signin" && (
          <form onSubmit={handleSignIn} className="flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="px-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-300"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="px-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-300"
              required
            />
            {error && (
              <p className="text-rose-300 text-sm text-center">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-yellow-400 text-indigo-900 font-bold rounded-full shadow-lg hover:bg-yellow-300 transition disabled:opacity-60"
              style={{ boxShadow: "0 0 18px rgba(253,224,71,0.4)" }}
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>
        )}

        {/* ---- SIGN UP: email ---- */}
        {mode === "signup" && step === "email" && (
          <form onSubmit={sendCode} className="flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="px-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-300"
              required
            />
            {error && (
              <p className="text-rose-300 text-sm text-center">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-yellow-400 text-indigo-900 font-bold rounded-full shadow-lg hover:bg-yellow-300 transition disabled:opacity-60"
              style={{ boxShadow: "0 0 18px rgba(253,224,71,0.4)" }}
            >
              {loading ? "Sending code..." : "Send Verification Code"}
            </button>
            <p className="text-white/40 text-xs text-center">
              Already have an account? Use the Log In tab instead — resending
              the code to an existing account can behave differently.
            </p>
          </form>
        )}

        {/* ---- SIGN UP: code ---- */}
        {mode === "signup" && step === "code" && (
          <form onSubmit={verifyCode} className="flex flex-col gap-3">
            <p className="text-white/70 text-sm text-center">
              Enter the code sent to {email}
            </p>
            <input
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter code"
              className="px-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/50 text-center tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-yellow-300"
              required
              autoFocus
            />
            {error && (
              <p className="text-rose-300 text-sm text-center">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-yellow-400 text-indigo-900 font-bold rounded-full shadow-lg hover:bg-yellow-300 transition disabled:opacity-60"
              style={{ boxShadow: "0 0 18px rgba(253,224,71,0.4)" }}
            >
              {loading ? "Verifying..." : "Verify Code"}
            </button>

            <p className="text-white/40 text-xs text-center leading-relaxed">
              Didn't get it? Check spam/junk first — university mail systems
              often filter new senders.
            </p>

            <button
              type="button"
              onClick={resendCode}
              disabled={resendCooldown > 0 || loading}
              className="text-white/70 text-sm hover:text-white transition disabled:opacity-40 disabled:hover:text-white/70"
            >
              {resendCooldown > 0
                ? `Resend code (${resendCooldown}s)`
                : "Resend code"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setError("");
                stopCooldown();
              }}
              className="text-white/60 text-sm hover:text-white transition"
            >
              Use a different email
            </button>
          </form>
        )}

        {/* ---- SIGN UP: set password ---- */}
        {mode === "signup" && step === "password" && (
          <form onSubmit={setAccountPassword} className="flex flex-col gap-3">
            <p className="text-white/70 text-sm text-center">
              Email verified! Create a password for future logins.
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              className="px-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-300"
              required
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className="px-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-300"
              required
            />
            {error && (
              <p className="text-rose-300 text-sm text-center">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-yellow-400 text-indigo-900 font-bold rounded-full shadow-lg hover:bg-yellow-300 transition disabled:opacity-60"
              style={{ boxShadow: "0 0 18px rgba(253,224,71,0.4)" }}
            >
              {loading ? "Saving..." : "Continue"}
            </button>
          </form>
        )}

        {/* ---- SIGN UP: pick university ---- */}
        {mode === "signup" && step === "university" && (
          <form onSubmit={setUniversityAndContinue} className="flex flex-col gap-3">
            <p className="text-white/70 text-sm text-center">
              Which school do you go to?
            </p>

            <div className="grid grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {UNIVERSITIES.map((school) => {
                const selected = university === school.id;
                return (
                  <button
                    key={school.id}
                    type="button"
                    onClick={() => setUniversity(school.id)}
                    className={`flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-xl border transition-all duration-150 ${
                      selected
                        ? "bg-yellow-400/15 border-yellow-300 shadow-[0_0_0_1px_rgba(253,224,71,0.5)]"
                        : "bg-white/5 border-white/15 hover:bg-white/10"
                    }`}
                  >
                    <span className="w-9 h-9 rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0">
                      <UniLogo school={school} size={24} />
                    </span>
                    <span
                      className={`text-[11px] font-semibold text-center leading-tight ${
                        selected ? "text-yellow-300" : "text-white/80"
                      }`}
                    >
                      {school.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {error && (
              <p className="text-rose-300 text-sm text-center">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-yellow-400 text-indigo-900 font-bold rounded-full shadow-lg hover:bg-yellow-300 transition disabled:opacity-60"
              style={{ boxShadow: "0 0 18px rgba(253,224,71,0.4)" }}
            >
              {loading ? "Saving..." : "Continue"}
            </button>
          </form>
        )}

        {/* ---- SIGN UP: major + class year ---- */}
        {mode === "signup" && step === "details" && (
          <form onSubmit={setDetailsAndContinue} className="flex flex-col gap-3">
            <p className="text-white/70 text-sm text-center">
              Tell us a bit more about your studies.
            </p>

            <input
              type="text"
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              placeholder="Your major (e.g. Biology)"
              maxLength={40}
              className="px-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-300"
              required
              autoFocus
            />

            <div className="grid grid-cols-2 gap-2">
              {CLASS_YEARS.map((year) => {
                const selected = classYear === year;
                return (
                  <button
                    key={year}
                    type="button"
                    onClick={() => setClassYear(year)}
                    className={`px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-150 ${
                      selected
                        ? "bg-yellow-400/15 border-yellow-300 text-yellow-300 shadow-[0_0_0_1px_rgba(253,224,71,0.5)]"
                        : "bg-white/5 border-white/15 text-white/80 hover:bg-white/10"
                    }`}
                  >
                    {year}
                  </button>
                );
              })}
            </div>

            {error && (
              <p className="text-rose-300 text-sm text-center">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-yellow-400 text-indigo-900 font-bold rounded-full shadow-lg hover:bg-yellow-300 transition disabled:opacity-60"
              style={{ boxShadow: "0 0 18px rgba(253,224,71,0.4)" }}
            >
              {loading ? "Saving..." : "Continue"}
            </button>
          </form>
        )}

        {/* ---- SIGN UP: choose username ---- */}
        {mode === "signup" && step === "username" && (
          <form onSubmit={setUsernameAndEnter} className="flex flex-col gap-3">
            <p className="text-white/70 text-sm text-center">
              Last step! Pick a username.
            </p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm font-semibold pointer-events-none">
                @
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.replace(/\s/g, ""))
                }
                placeholder="username"
                maxLength={20}
                className="w-full pl-8 pr-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/50 text-center focus:outline-none focus:ring-2 focus:ring-yellow-300"
                required
                autoFocus
              />
            </div>
            <p className="text-white/40 text-xs text-center">
              3–20 characters. Letters, numbers, and underscores only — this
              is what other students will see you as. You can change this
              later.
            </p>
            {error && (
              <p className="text-rose-300 text-sm text-center">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-yellow-400 text-indigo-900 font-bold rounded-full shadow-lg hover:bg-yellow-300 transition disabled:opacity-60"
              style={{ boxShadow: "0 0 18px rgba(253,224,71,0.4)" }}
            >
              {loading ? "Saving..." : "Create Account & Enter"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// Small dot-progress row shown above the signup form so people can see how
// many steps are left. Purely visual — doesn't gate navigation.
function StepProgress({ step, steps }) {
  const currentIndex = steps.indexOf(step);
  if (currentIndex === -1) return null;

  return (
    <div className="flex items-center justify-center gap-1.5 mb-5">
      {steps.map((s, i) => (
        <span
          key={s}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === currentIndex
              ? "w-6 bg-yellow-300"
              : i < currentIndex
              ? "w-1.5 bg-yellow-300/50"
              : "w-1.5 bg-white/20"
          }`}
        />
      ))}
    </div>
  );
}

// Stands in for the planet Neptune — a blue/cyan gradient sphere with a
// tilted white atmospheric band, matching the icon used in Nav.jsx.
function NeptuneIcon({ size = 26 }) {
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
        <radialGradient id="neptuneBodyAuth" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="45%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </radialGradient>
      </defs>
      <ellipse cx="20" cy="26" rx="15" ry="4" fill="#ffffff" opacity="0.45" transform="rotate(-14 20 26)" />
      <circle cx="20" cy="19" r="12" fill="url(#neptuneBodyAuth)" />
      <path d="M9 15 Q20 19 31 14" stroke="#0c4a6e" strokeWidth="1.2" opacity="0.4" fill="none" />
      <path d="M8 22 Q20 26 32 21" stroke="#0c4a6e" strokeWidth="1" opacity="0.3" fill="none" />
    </svg>
  );
}

// Same scattered campus/Greek-life iconography as the rest of the site, but
// a smaller, sparser set — this page is a compact centered card, not a full
// hero, so the texture stays quiet around the edges instead of competing
// with the form.
const CAMPUS_ICONS = ["🎓", "Σ", "🏛️", "Δ", "📜", "Ω", "🎓", "Φ"];

function ScatteredCrests() {
  const placements = useMemo(() => {
    return [
      { top: "4%", left: "6%", rot: -12, size: "text-6xl", dx: 12, dy: -10, dur: 17 },
      { top: "6%", left: "30%", rot: 8, size: "text-4xl", dx: -10, dy: 10, dur: 14 },
      { top: "8%", left: "70%", rot: -10, size: "text-5xl", dx: -14, dy: -10, dur: 19 },
      { top: "5%", left: "92%", rot: 9, size: "text-5xl", dx: -12, dy: 12, dur: 16 },
      { top: "20%", left: "16%", rot: 10, size: "text-4xl", dx: 10, dy: 14, dur: 15 },
      { top: "22%", left: "50%", rot: -7, size: "text-4xl", dx: 8, dy: -12, dur: 13 },
      { top: "18%", left: "84%", rot: 7, size: "text-4xl", dx: -10, dy: 10, dur: 18 },
      { top: "38%", left: "4%", rot: 6, size: "text-4xl", dx: 8, dy: -14, dur: 14 },
      { top: "40%", left: "92%", rot: -10, size: "text-5xl", dx: -10, dy: 10, dur: 16 },
      { top: "58%", left: "10%", rot: -8, size: "text-4xl", dx: 10, dy: -10, dur: 15 },
      { top: "60%", left: "90%", rot: 12, size: "text-4xl", dx: -12, dy: 12, dur: 17 },
      { top: "76%", left: "14%", rot: -8, size: "text-5xl", dx: 10, dy: -12, dur: 20 },
      { top: "74%", left: "48%", rot: 6, size: "text-3xl", dx: -8, dy: 10, dur: 12 },
      { top: "80%", left: "82%", rot: 9, size: "text-5xl", dx: -12, dy: 12, dur: 18 },
      { top: "92%", left: "24%", rot: 5, size: "text-4xl", dx: 10, dy: 10, dur: 13 },
      { top: "94%", left: "60%", rot: -6, size: "text-4xl", dx: -10, dy: -10, dur: 15 },
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
            opacity: 0.6,
            filter:
              "drop-shadow(0 0 8px rgba(253,224,71,0.6)) drop-shadow(0 0 20px rgba(253,224,71,0.35))",
          }}
        >
          {CAMPUS_ICONS[i % CAMPUS_ICONS.length]}
        </span>
      ))}
    </div>
  );
}

// Same twinkling star field as the rest of the site, at a lighter density.
function StarField() {
  const stars = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 40; i++) {
      arr.push({
        top: `${(i * 29 + (i % 5) * 13) % 100}%`,
        left: `${(i * 47 + (i % 7) * 11) % 100}%`,
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

// Renders a school logo, falling back to its initial if the image fails to
// load (e.g. a filename typo or a file not yet added to public/logos).
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