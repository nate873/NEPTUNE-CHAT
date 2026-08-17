import { useState } from "react";
import Nav from "./Nav";
import { supabase } from "./supabaseClient";

// Same school list used on the sign-up flow (EduAuth) — keep these three in
// sync if you add/remove a university anywhere in the app.
const UNIVERSITIES = [
  { id: "ucf", name: "UCF" },
  { id: "msu", name: "Michigan State University" },
  { id: "asu", name: "ASU" },
  { id: "uf", name: "UF" },
  { id: "fsu", name: "FSU" },
  { id: "fau", name: "FAU" },
  { id: "uga", name: "University of Georgia" },
  { id: "osu", name: "Ohio State" },
  { id: "umiami", name: "University of Miami" },
  { id: "ucla", name: "UCLA" },
  { id: "usc", name: "USC" },
];

const YEARS = ["Freshman", "Sophomore", "Junior", "Senior", "Grad student"];

const initialForm = {
  fullName: "",
  email: "",
  university: "",
  year: "",
  involvement: "",
  why: "",
  socialHandle: "",
  commit: false,
};

export default function AmbassadorApplication({ onBack, onGetStarted }) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function isValidEduEmail(value) {
    // Requires a .edu address specifically — same bar as the rest of the
    // site's "verified student" promise, even at the application stage.
    return /^[^\s@]+@[^\s@]+\.edu$/i.test(value.trim());
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.fullName.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (!isValidEduEmail(form.email)) {
      setError("Please enter a valid .edu email address.");
      return;
    }
    if (!form.university) {
      setError("Please select your university.");
      return;
    }
    if (!form.year) {
      setError("Please select your year.");
      return;
    }
    if (form.involvement.trim().length < 5) {
      setError("Tell us at least a little about your campus involvement.");
      return;
    }
    if (form.why.trim().length < 5) {
      setError("Tell us a bit about why you'd be a good fit.");
      return;
    }
    if (!form.commit) {
      setError("Ambassadors need to commit for a full semester — please confirm you can.");
      return;
    }

    const school = UNIVERSITIES.find((u) => u.id === form.university);

    setLoading(true);
    const { error: insertError } = await supabase
      .from("ambassador_applications")
      .insert({
        full_name: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        university: school.id,
        university_name: school.name,
        year: form.year,
        involvement: form.involvement.trim(),
        why: form.why.trim(),
        social_handle: form.socialHandle.trim() || null,
      });
    setLoading(false);

    if (insertError) {
      // Most common cause here is the table/policy not being set up yet —
      // see the SQL block in this file's header comment.
      setError(
        insertError.message.includes("does not exist")
          ? "Applications aren't set up yet on our end — please try again soon."
          : insertError.message
      );
      return;
    }

    setSubmitted(true);
  }

  return (
    <div
      className="min-h-screen w-full bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-600 overflow-hidden relative"
      style={{ zoom: 1.2 }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-yellow-300/20 blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-[28rem] h-[28rem] rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
      </div>

      <Nav onHome={onBack} onAmbassadors={onBack} onGetStarted={onGetStarted} />

      <div className="relative z-10 max-w-xl mx-auto px-6 pt-6 pb-16">
        <button
          onClick={onBack}
          className="text-white/60 hover:text-white text-sm font-medium transition mb-6 inline-flex items-center gap-1.5"
        >
          ← Back to Ambassadors
        </button>

        {submitted ? (
          <div className="bg-white/10 border border-white/20 backdrop-blur rounded-2xl shadow-xl p-8 md:p-10 text-center">
            <span className="text-4xl">🔱</span>
            <h1 className="mt-4 text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Application sent
            </h1>
            <p className="mt-3 text-white/70 text-sm md:text-base max-w-sm mx-auto">
              Thanks, {form.fullName.split(" ")[0]} — we'll review your
              application and follow up at {form.email} within a few days.
            </p>
            <button
              onClick={onBack}
              className="mt-8 px-8 py-3.5 rounded-full bg-yellow-400 text-indigo-900 font-extrabold shadow-md transition-all duration-200 hover:bg-yellow-300 hover:scale-105 active:scale-95"
            >
              Back to Ambassadors
            </button>
          </div>
        ) : (
          <div className="bg-white/10 border border-white/20 backdrop-blur rounded-2xl shadow-xl p-8 md:p-10">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight text-center">
              Ambassador application
            </h1>
            <p className="mt-2 text-white/60 text-sm text-center">
              Takes about two minutes.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
              <Field label="Full name">
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  placeholder="Jordan Smith"
                  className={inputClass}
                  required
                />
              </Field>

              <Field label=".edu email">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="you@school.edu"
                  className={inputClass}
                  required
                />
              </Field>

              <Field label="University">
                <select
                  value={form.university}
                  onChange={(e) => update("university", e.target.value)}
                  className={`${inputClass} appearance-none`}
                  required
                >
                  <option value="" disabled className="text-slate-500">
                    Select your school
                  </option>
                  {UNIVERSITIES.map((u) => (
                    <option key={u.id} value={u.id} className="text-slate-900">
                      {u.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Year">
                <div className="flex flex-wrap gap-2">
                  {YEARS.map((y) => {
                    const selected = form.year === y;
                    return (
                      <button
                        key={y}
                        type="button"
                        onClick={() => update("year", y)}
                        className={`px-3.5 py-2 rounded-full text-xs font-semibold border transition-all duration-150 ${
                          selected
                            ? "bg-yellow-400/15 border-yellow-300 text-yellow-300"
                            : "bg-white/5 border-white/15 text-white/70 hover:bg-white/10"
                        }`}
                      >
                        {y}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field label="Campus involvement">
                <textarea
                  value={form.involvement}
                  onChange={(e) => update("involvement", e.target.value)}
                  placeholder="Clubs, orgs, teams, or communities you're active in"
                  rows={2}
                  className={`${inputClass} rounded-2xl resize-none`}
                  required
                />
              </Field>

              <Field label="Why do you want to be an ambassador?">
                <textarea
                  value={form.why}
                  onChange={(e) => update("why", e.target.value)}
                  placeholder="A sentence or two is plenty"
                  rows={3}
                  className={`${inputClass} rounded-2xl resize-none`}
                  required
                />
              </Field>

              <Field label="Instagram or TikTok handle (optional)">
                <input
                  type="text"
                  value={form.socialHandle}
                  onChange={(e) => update("socialHandle", e.target.value)}
                  placeholder="@yourhandle"
                  className={inputClass}
                />
              </Field>

              <label className="flex items-start gap-3 mt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.commit}
                  onChange={(e) => update("commit", e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-yellow-400"
                />
                <span className="text-white/70 text-sm leading-snug">
                  I can commit to being an ambassador for a full semester.
                </span>
              </label>

              {error && (
                <p className="text-rose-300 text-sm text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 px-8 py-4 rounded-full bg-yellow-400 text-indigo-900 font-extrabold shadow-lg transition-all duration-200 hover:bg-yellow-300 hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:hover:scale-100"
              >
                {loading ? "Submitting..." : "Submit Application →"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

const inputClass =
  "px-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-300 text-sm";

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-white/60 text-xs font-semibold uppercase tracking-wide">
        {label}
      </span>
      {children}
    </div>
  );
}

/*
SUPABASE SETUP — run this once in the SQL editor before applications can be
submitted. Row Level Security is on by default, so without the insert policy
below every submission will fail with a "policy" error.

  create table ambassador_applications (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz default now(),
    full_name text not null,
    email text not null,
    university text not null,
    university_name text not null,
    year text not null,
    involvement text not null,
    why text not null,
    social_handle text
  );

  alter table ambassador_applications enable row level security;

  create policy "Anyone can submit an application"
    on ambassador_applications
    for insert
    to anon
    with check (true);
*/