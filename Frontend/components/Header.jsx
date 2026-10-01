export const ThemeToggle = ({ isDark, onToggleTheme, className = "" }) => (
  <button
    type="button"
    onClick={onToggleTheme}
    aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    title={isDark ? "Light mode" : "Dark mode"}
    className={`border border-edge p-1.5 cursor-pointer transition-colors
      hover:bg-ink hover:text-on-ink ${className}`}
  >
    {isDark ? (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round"
        strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41" />
      </svg>
    ) : (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round"
        strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    )}
  </button>
);

const Header = ({ user, theme, onToggleTheme, onSignOut }) => {
  const isDark = theme === "dark";
  return (
    <header className="sticky top-0 z-20 w-full bg-canvas/95 backdrop-blur px-4 sm:px-6 py-3 anim-fade-in">
      <nav className="max-w-6xl mx-auto flex items-center justify-between gap-3
        border border-edge bg-surface px-3 sm:px-4 py-2">

        {/* Brand: lens glyph + wordmark */}
        <a href="#" className="group flex items-center gap-2.5 shrink-0">
          <span className="flex h-7 w-7 items-center justify-center border
            border-edge transition-colors group-hover:bg-ink group-hover:text-on-ink">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="14.31" y1="8" x2="20.05" y2="17.94" />
              <line x1="9.69" y1="8" x2="21.17" y2="8" />
              <line x1="7.38" y1="12" x2="13.12" y2="2.06" />
              <line x1="9.69" y1="16" x2="3.95" y2="6.06" />
              <line x1="14.31" y1="16" x2="2.83" y2="16" />
              <line x1="16.62" y1="12" x2="10.88" y2="21.94" />
            </svg>
          </span>
          <span className="text-lg sm:text-xl font-bold tracking-tight">
            DevLens
          </span>
        </a>

        {/* Right: account chip + theme toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 anim-pop-in">
            <img
              src={user.avatar}
              alt={user.login}
              className="h-6 w-6 rounded-full border border-edge shrink-0"
            />
            <a
              href={user.profile}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:block text-sm font-medium hover:underline
                max-w-[120px] truncate"
              title={user.login}
            >
              {user.login}
            </a>
            <span aria-hidden="true" className="hidden sm:block h-4 w-px bg-line" />
            <button
              type="button"
              onClick={onSignOut}
              aria-label="Sign out"
              title="Sign out"
              className="border border-edge p-1.5 cursor-pointer transition-colors
                hover:bg-ink hover:text-on-ink"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>

          <ThemeToggle isDark={isDark} onToggleTheme={onToggleTheme} />
        </div>
      </nav>
    </header>
  );
};

export default Header;
