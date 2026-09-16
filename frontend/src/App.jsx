import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

import LandingPage from "./LandingPage";
import AmbassadorsPage from "./AmbassadorsPage";
import AmbassadorApplication from "./AmbassadorApplication";
import OmegleAlternative from "./OmegleAlternative";

import EduAuth from "./EduAuth";
import ChatRoom from "./ChatRoom";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("signup");

  // User has fully completed authentication/onboarding.
  const [authComplete, setAuthComplete] = useState(false);

  // Ambassador application is still temporary state.
  const [showApplication, setShowApplication] = useState(false);

  // =========================================================
  // PUBLIC URL ROUTING
  // =========================================================

  const [publicPath, setPublicPath] = useState(
    normalizePath(window.location.pathname)
  );

  // =========================================================
  // SUPABASE AUTH
  // =========================================================

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);

      if (data.session) {
        setAuthComplete(true);
      }

      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);

        if (!newSession) {
          setAuthComplete(false);
          setShowAuth(false);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // =========================================================
  // BROWSER BACK / FORWARD
  // =========================================================

  useEffect(() => {
    const handlePopState = () => {
      setPublicPath(
        normalizePath(window.location.pathname)
      );

      setShowApplication(false);
      setShowAuth(false);
    };

    window.addEventListener(
      "popstate",
      handlePopState
    );

    return () => {
      window.removeEventListener(
        "popstate",
        handlePopState
      );
    };
  }, []);

  // =========================================================
  // SCROLL TO TOP WHEN PAGE CHANGES
  // =========================================================

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [publicPath]);

  // =========================================================
  // PUBLIC NAVIGATION
  // =========================================================

  function navigatePublic(path) {
    const normalized =
      normalizePath(path);

    if (
      normalizePath(
        window.location.pathname
      ) !== normalized
    ) {
      window.history.pushState(
        {},
        "",
        normalized
      );
    }

    setPublicPath(normalized);

    setShowApplication(false);
    setShowAuth(false);
  }

  function handleHome() {
    navigatePublic("/");
  }

  function handleOpenOmegleAlternative() {
    navigatePublic(
      "/omegle-alternative"
    );
  }

  function handleOpenAmbassadors() {
    navigatePublic("/ambassadors");
  }

  // =========================================================
  // AUTH
  // =========================================================

  function handleFinish(
    finishedSession
  ) {
    setSession(finishedSession);
    setAuthComplete(true);
    setShowAuth(false);
    setShowApplication(false);

    // Chat application lives at /
    if (
      window.location.pathname !== "/"
    ) {
      window.history.pushState(
        {},
        "",
        "/"
      );

      setPublicPath("/");
    }
  }

  function handleGetStarted(mode) {
    // Return to the app root before
    // opening authentication.
    if (
      window.location.pathname !== "/"
    ) {
      window.history.pushState(
        {},
        "",
        "/"
      );
    }

    setPublicPath("/");

    setShowApplication(false);

    setAuthMode(
      mode || "signup"
    );

    setShowAuth(true);
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-600 flex items-center justify-center">
        <div className="text-center">
          <div
            className="
              w-10
              h-10
              mx-auto
              mb-4
              rounded-full
              border-4
              border-white/20
              border-t-yellow-300
              animate-spin
            "
          />

          <p className="text-white font-medium">
            Loading Neptune Chat...
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // PUBLIC SEO / GEO PAGE:
  // OMEGLE ALTERNATIVE
  // =========================================================

  if (
    publicPath ===
    "/omegle-alternative"
  ) {
    return (
      <OmegleAlternative
        onHome={handleHome}
        onAmbassadors={
          handleOpenAmbassadors
        }
        onGetStarted={
          handleGetStarted
        }
      />
    );
  }

  // =========================================================
  // PUBLIC PAGE:
  // AMBASSADORS
  // =========================================================

  if (
    publicPath === "/ambassadors"
  ) {
    // Application form
    if (showApplication) {
      return (
        <AmbassadorApplication
          onBack={() =>
            setShowApplication(false)
          }
          onGetStarted={
            handleGetStarted
          }
        />
      );
    }

    // Ambassador marketing page
    return (
      <AmbassadorsPage
        onBack={handleHome}
        onGetStarted={
          handleGetStarted
        }
        onApply={() =>
          setShowApplication(true)
        }
      />
    );
  }

  // =========================================================
  // PUBLIC HOME / AUTH
  // =========================================================

  if (!authComplete) {
    if (!showAuth) {
      return (
        <LandingPage
          onGetStarted={
            handleGetStarted
          }
          onAmbassadors={
            handleOpenAmbassadors
          }
          onOmegleAlternative={
            handleOpenOmegleAlternative
          }
        />
      );
    }

    return (
      <EduAuth
        onVerified={handleFinish}
        initialMode={authMode}
      />
    );
  }

  // =========================================================
  // AUTHENTICATED CHAT APP
  // =========================================================

  return (
    <ChatRoom session={session} />
  );
}

// =========================================================
// NORMALIZE URL
// =========================================================

function normalizePath(path) {
  if (!path) {
    return "/";
  }

  let normalized = path
    .split("?")[0]
    .split("#")[0];

  if (
    normalized.length > 1 &&
    normalized.endsWith("/")
  ) {
    normalized =
      normalized.slice(0, -1);
  }

  return normalized || "/";
}

export default App;