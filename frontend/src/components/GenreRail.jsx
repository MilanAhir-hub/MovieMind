export default function GenreRail({ onOpenFilters, onOpenGenreModal }) {
  return (
    <section className="genre-rail-section border-y border-[#262626] bg-[#0a0a0a]/90 backdrop-blur-sm sticky top-18 z-40 py-3">
      <div className="wrap max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          {/* Filter Button */}
          <button
            type="button"
            onClick={onOpenFilters}
            className="inline-flex items-center gap-2 bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-xs sm:text-sm px-5 py-2 rounded-full shadow-[0_2px_12px_rgba(229,9,20,0.45)] hover:shadow-[0_4px_16px_rgba(229,9,20,0.6)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            title="Open Filters"
          >
            <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
            </svg>
            <span>Filter</span>
          </button>

          {/* Quick Genres Button */}
          <button
            type="button"
            onClick={onOpenGenreModal}
            className="inline-flex items-center gap-2 bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-xs sm:text-sm px-5 py-2 rounded-full shadow-[0_2px_12px_rgba(229,9,20,0.45)] hover:shadow-[0_4px_16px_rgba(229,9,20,0.6)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            title="Open Quick Genres"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
            </svg>
            <span>Quick Genres</span>
          </button>
        </div>
      </div>
    </section>
  );
}
