// Footer — matches original netflix-footer section from HTML
export default function Footer() {
  return (
    <footer className="netflix-footer border-t border-[#262626] bg-[#0c0c0c] py-12 mt-16 text-[#808080] text-xs">
      <div className="wrap max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b border-[#222222]">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black tracking-wider text-[#E50914]">MOVIEMIND</span>
            <span className="text-[11px] text-[#666666]">· Symbolic AI Cinema Engine</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#prefs-section" className="hover:text-white transition-colors">Preferences</a>
            <a href="#results-section" className="hover:text-white transition-colors">Recommendations</a>
            <a href="#trace" className="hover:text-white transition-colors">Reasoning Trace</a>
            <a href="#kb" className="hover:text-white transition-colors">Movie Database</a>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#555555]">
          <p>AI Subject Project · Knowledge Representation, Forward Chaining, Heuristic Evaluation &amp; Best-First Queue.</p>
          <p>Python Flask Backend + React.js / Tailwind CSS v4.</p>
        </div>
      </div>
    </footer>
  );
}
