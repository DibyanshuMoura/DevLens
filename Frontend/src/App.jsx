import { useEffect, useState } from "react";
import Header, { ThemeToggle } from "../components/Header";
import Middle from "../components/Middle";
import Footer from "../components/Footer";
import Landing from "../components/Landing";
import PlusPattern from "../components/PlusPattern";
import {
  clearToken,
  fetchMe,
  consumeTokenFromUrl,
  authErrorMessage,
  readCachedUser,
} from "./lib/auth";

function bootstrap() {
  const err = authErrorMessage();
  const user = consumeTokenFromUrl() ?? readCachedUser();
  return { user, err };
}

const App = () => {
  const [session, setSession] = useState(bootstrap);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("devlens-theme") || "light",
  );
  const { user: initialUser } = session;
  const [user, setUser] = useState(initialUser);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("devlens-theme", theme);
  }, [theme]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const me = initialUser ?? (await fetchMe());
      if (cancelled || me === undefined) return;
      setUser(me);
    })();

    return () => {
      cancelled = true;
    };
  }, [initialUser]);

  const handleSignIn = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/github`;
  };

  const handleSignOut = () => {
    clearToken();
    setSession({ user: null, err: null });
    setUser(null);
  };

  const handleToggleTheme = () => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  };

  return (
    <div className="plusminus w-full min-h-screen bg-canvas flex flex-col">
      <PlusPattern />
      {session.err && (
        <p className="bg-ink text-on-ink text-sm text-center py-2 px-4 anim-fade-in">
          {session.err}
        </p>
      )}

      {user ? (
        <>
          <Header
            theme={theme}
            onToggleTheme={handleToggleTheme}
            onSignOut={handleSignOut}
          />
          <Middle user={user} theme={theme} />
        </>
      ) : (
        <>
          {}
          <ThemeToggle
            isDark={theme === "dark"}
            onToggleTheme={handleToggleTheme}
            className="fixed top-4 right-4 z-30 bg-surface"
          />
          <main className="w-full flex items-center justify-center flex-1 px-6 pt-14 sm:pt-16">
            <Landing onSignIn={handleSignIn} theme={theme} />
          </main>
          <Footer />
        </>
      )}
    </div>
  );
};

export default App;
