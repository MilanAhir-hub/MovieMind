import Button from './Button';

// Navbar component with transparent background and reusable rounded-full button
export default function Navbar({ movieCount, onOpenPrefs }) {
  return (
    <header className="netflix-navbar fixed top-0 left-0 right-0 z-50 bg-transparent transition-all duration-300">
      <div className="wrap max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        <div className="flex items-center gap-8">
          {/* Netflix-style Brand Logo */}
          <a href="#" className="brand-logo flex items-center gap-2 group">
            <span className="brand-text">MOVIEMIND</span>
            <span className="brand-badge">AI</span>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a
              href="#prefs-section"
              className="nav-link active"
              onClick={e => {
                if (onOpenPrefs) {
                  onOpenPrefs();
                }
              }}
            >
              Matcher
            </a>
            <a href="#results-section" className="nav-link">Top Recommendations</a>
            <a href="#trace" className="nav-link">How AI Works</a>
            <a href="#kb" className="nav-link">Catalog (10k)</a>
          </nav>
        </div>

        {/* Right Header Status Pill & Reusable Button */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-[#1f1f1f]/80 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-full text-xs text-[#B3B3B3]">
            <span className="w-2 h-2 rounded-full bg-[#46d369] animate-pulse"></span>
            <span>{movieCount ? `${movieCount.toLocaleString()} Movies Indexed` : '9,979 Movies Indexed'}</span>
          </div>

          <Button
            href="#prefs-section"
            variant="primary"
            size="md"
            rounded="full"
            className="hidden sm:inline-flex"
            onClick={e => {
              if (onOpenPrefs) {
                onOpenPrefs();
              }
            }}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/>
              </svg>
            }
          >
            Find Movie
          </Button>
        </div>
      </div>
    </header>
  );
}
