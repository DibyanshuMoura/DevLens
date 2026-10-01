import githubLogo from "../assets/github.svg";
import xLogo from "../assets/x.svg";

const Footer = () => {
  return (
    <footer className="w-full border-t border-edge bg-canvas mt-8">
      <div className="px-6 py-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
        {/* Brand column */}
        <div className="flex flex-col gap-3">
          <span className="font-bold text-lg">DevLens</span>
          <p className="text-muted leading-relaxed">
            AI-powered GitHub profile analysis with resume cross-checking — see
            your profile the way recruiters do.
          </p>
        </div>

        {/* Product links column */}
        <div className="flex flex-col gap-2">
          <h4 className="font-medium mb-1">Product</h4>
          <a href="#features" className="text-muted hover:text-ink transition-colors w-fit">
            Features
          </a>
          <a href="#how-it-works" className="text-muted hover:text-ink transition-colors w-fit">
            How it works
          </a>
          <a href="#" className="text-muted hover:text-ink transition-colors w-fit">
            Analyze a profile
          </a>
        </div>

        {/* Contact column */}
        <div className="flex flex-col gap-2">
          <h4 className="font-medium mb-1">Contact</h4>
          <a
            href="mailto:work.dibyanshumoura@gmail.com"
            className="text-muted hover:text-ink transition-colors w-fit"
          >
            work.dibyanshumoura@gmail.com
          </a>
          <div className="flex items-center gap-3 mt-1">
            <a
              href="https://github.com/DibyanshuMoura"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-70 hover:opacity-100 transition-opacity"
              aria-label="GitHub"
            >
              <img src={githubLogo} alt="GitHub" className="h-5 w-5 dark:invert" />
            </a>
            <a
              href="https://x.com/DibyanshuMoura"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-70 hover:opacity-100 transition-opacity"
              aria-label="X"
            >
              <img src={xLogo} alt="X" className="h-5 w-5 dark:invert" />
            </a>
          </div>
        </div>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="px-6 py-3">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-1 text-xs text-muted">
            <p>copyright &copy; 2026 Dev-Lens. All rights reserved.</p>
            <p>Built with GitHub API &amp; Groq</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
