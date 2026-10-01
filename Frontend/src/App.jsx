import { useEffect, useState } from "react";
import Header, { ThemeToggle } from "../components/Header";
import Middle from "../components/Middle";
import Footer from "../components/Footer";
import Landing from "../components/Landing";
import {
  getToken,
  clearToken,
  fetchMe,
  consumeTokenFromUrl,
  authErrorMessage,
} from "./lib/auth";

const App = () => {
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("devlens-theme") || "light",
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("devlens-theme", theme);
  }, [theme]);

  useEffect(() => {
    const urlUser = consumeTokenFromUrl();
    if (urlUser) {
      setUser(urlUser);
      return;
    }
    const err = authErrorMessage();
    if (err) setAuthError(err);
    fetchMe().then(setUser);
  }, []);

  const handleSignIn = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/github`;
  };

  const handleSignOut = () => {
    clearToken();
    setUser(null);
  };

  const handleToggleTheme = () => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  };

  return (
    <div className="w-full min-h-full bg-canvas flex flex-col">
      {authError && (
        <p className="bg-ink text-on-ink text-sm text-center py-2 px-4 anim-fade-in">
          {authError}
        </p>
      )}

      {user ? (
        <>
          <Header
            user={user}
            theme={theme}
            onToggleTheme={handleToggleTheme}
            onSignOut={handleSignOut}
          />
          <Middle user={user} theme={theme} />
        </>
      ) : (
        <>
          {/* No navbar on the landing page — standalone theme toggle instead */}
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
