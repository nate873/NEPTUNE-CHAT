import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import LandingPage from "./LandingPage";
import AmbassadorsPage from "./AmbassadorsPage"; // must match your actual filename exactly
import EduAuth from "./EduAuth";
import ChatRoom from "./ChatRoom";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("signup"); // "signin" | "signup"
  // Tracks whether the user has FULLY completed onboarding
  // (either they were already logged in from a past visit, or they
  // just finished the sign-up flow including setting a password).
  // This prevents the app from jumping straight to ChatRoom the instant
  // Supabase creates a session mid-verification, before the password step.
  const [authComplete, setAuthComplete] = useState(false);
  // Shows the public Ambassadors marketing page, independent of auth state.
  const [showAmbassadors, setShowAmbassadors] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        // A session already existed (returning user reload) — fully logged in.
        setAuthComplete(true);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        if (!newSession) {
          // Signed out — reset everything back to the start.
          setAuthComplete(false);
          setShowAuth(false);
        }
        // NOTE: we intentionally do NOT set authComplete = true here just
        // because a session appeared. During sign-up, verifyOtp() creates
        // a session before the user has set a password. authComplete only
        // becomes true via EduAuth's onVerified callback (handleFinish below)
        // or if a session already existed on initial load (above).
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  function handleFinish(finishedSession) {
    setSession(finishedSession);
    setAuthComplete(true);
  }

  // Shared handler so both pages' nav "Log In"/"Sign Up" buttons behave the
  // same way: drop out of the Ambassadors page (if on it) and into auth.
  function handleGetStarted(mode) {
    setShowAmbassadors(false);
    setAuthMode(mode || "signup");
    setShowAuth(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-600 flex items-center justify-center">
        <p className="text-white font-medium">Loading...</p>
      </div>
    );
  }

  // Ambassadors page is public marketing content — show it regardless of
  // auth state, before we branch into the sign-up/chat flow below.
  if (showAmbassadors) {
    return (
      <AmbassadorsPage
        onBack={() => setShowAmbassadors(false)}
        onGetStarted={handleGetStarted}
        onApply={() => handleGetStarted("signup")}
      />
    );
  }

  if (!authComplete) {
    if (!showAuth) {
      return (
        <LandingPage
          onGetStarted={handleGetStarted}
          onAmbassadors={() => setShowAmbassadors(true)}
        />
      );
    }
    return <EduAuth onVerified={handleFinish} initialMode={authMode} />;
  }

  return <ChatRoom session={session} />;
}

export default App;