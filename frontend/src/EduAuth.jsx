import { useEffect, useRef, useState } from "react";
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

export default function EduAuth({ onVerified, initialMode = "signin" }) {
  const [mode, setMode] = useState(initialMode); // signin | signup
  const [step, setStep] = useState("email"); // email | code | password | university | name
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [university, setUniversity] = useState(""); // UNIVERSITIES[].id
  const [displayName, setDisplayName] = useState("");
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
    setDisplayName("");
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

    // University set — now have them pick a display name before entering
    setStep("name");
  }

  // ---- SIGN UP step 5: choose a display name ----
  async function setDisplayNameAndEnter(e) {
    e.preventDefault();
    setError("");

    const trimmed = displayName.trim();
    if (trimmed.length < 2 || trimmed.length > 20) {
      setError("Name must be between 2 and 20 characters.");
      return;
    }
    if (!/^[a-zA-Z0-9 _-]+$/.test(trimmed)) {
      setError("Name can only contain letters, numbers, spaces, - and _.");
      return;
    }

    setLoading(true);
    // Storing this under `display_name` in user_metadata is what makes it
    // show up in the Supabase dashboard's Auth > Users "Display name" column.
    const { error } = await supabase.auth.updateUser({
      data: { display_name: trimmed },
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
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-600 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-white text-center mb-1">
          🔱 Neptune Chat
        </h1>
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
            >
              {loading ? "Saving..." : "Continue"}
            </button>
          </form>
        )}

        {/* ---- SIGN UP: choose display name ---- */}
        {mode === "signup" && step === "name" && (
          <form onSubmit={setDisplayNameAndEnter} className="flex flex-col gap-3">
            <p className="text-white/70 text-sm text-center">
              Last step! What should people call you?
            </p>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Choose a name"
              maxLength={20}
              className="px-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/50 text-center focus:outline-none focus:ring-2 focus:ring-yellow-300"
              required
              autoFocus
            />
            <p className="text-white/40 text-xs text-center">
              2–20 characters. You can change this later.
            </p>
            {error && (
              <p className="text-rose-300 text-sm text-center">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-yellow-400 text-indigo-900 font-bold rounded-full shadow-lg hover:bg-yellow-300 transition disabled:opacity-60"
            >
              {loading ? "Saving..." : "Create Account & Enter"}
            </button>
          </form>
        )}
      </div>
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