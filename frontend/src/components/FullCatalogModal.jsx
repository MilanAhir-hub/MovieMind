import { useState, useEffect, useRef, useCallback } from 'react';
import { getJson, formatRating } from '../utils';
import MovieCard from './MovieCard';

export default function FullCatalogModal({ isOpen, onClose, onSelectMovie }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [matches, setMatches] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const containerRef = useRef(null);
  const searchTimer = useRef(null);
  const PAGE_SIZE = 20;

  const loadMovies = useCallback(async (searchQuery = '') => {
    setLoading(true);
    try {
      const data = await getJson(`/api/movies?limit=100&search=${encodeURIComponent(searchQuery)}`);
      setMovies(data.movies || []);
      setTotal(data.total || 0);
      setMatches(data.matches || 0);
      setCurrentPage(1);
    } catch (err) {
      console.error('Failed to load catalog movies:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadMovies(search);
      const originalHtmlOverflow = document.documentElement.style.overflow;
      const originalBodyOverflow = document.body.style.overflow;

      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.documentElement.classList.add('modal-open');
      document.body.classList.add('modal-open');

      return () => {
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.classList.remove('modal-open');
        document.body.classList.remove('modal-open');
      };
    }
  }, [isOpen, loadMovies]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  // Scroll tracking for scroll to above button
  const handleScroll = (e) => {
    if (e.target.scrollTop > 300) {
      setShowScrollTop(true);
    } else {
      setShowScrollTop(false);
    }
  };

  const scrollToAbove = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  function handleSearchChange(val) {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      loadMovies(val);
    }, 250);
  }

  if (!isOpen) return null;

  // Pagination calculation (20 movies per page from 100 movies)
  const totalPages = Math.ceil(movies.length / PAGE_SIZE) || 1;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const currentMovies = movies.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="fixed inset-0 z-100 bg-[#141414] text-white overflow-y-auto animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-30 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-[#262626] px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1f1f1f] hover:bg-[#2e2e2e] border border-white/10 hover:border-white/20 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
              <span>Back to Home</span>
            </button>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2 h-4 bg-[#E50914] rounded-full"></span>
                <span>Full Movie Catalog</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#242424] text-white/70 border border-white/10">
                  {total.toLocaleString()} Films
                </span>
              </h1>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-md min-w-[200px]">
            <svg className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              type="search"
              placeholder="Search movies by title…"
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              className="w-full bg-[#1f1f1f] border border-[#333333] focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] rounded-full pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-white/40 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-[#262626]">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Showing 100 Movies Catalog
            </h2>
            <p className="text-xs sm:text-sm text-white/70 mt-1">
              Page {currentPage} of {totalPages} (Displaying movies {startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, movies.length)} of {movies.length})
            </p>
          </div>

          {/* Pagination Pill Selector */}
          <div className="flex items-center gap-1.5 bg-[#1f1f1f] border border-[#2e2e2e] p-1 rounded-full text-xs">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="px-3 py-1 rounded-full text-white/80 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
              <button
                key={num}
                type="button"
                onClick={() => {
                  setCurrentPage(num);
                  scrollToAbove();
                }}
                className={`w-7 h-7 rounded-full text-xs font-bold transition cursor-pointer ${
                  currentPage === num
                    ? 'bg-[#E50914] text-white shadow-md'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="px-3 py-1 rounded-full text-white/80 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>

        {/* 20 Movie Posters Grid */}
        {loading ? (
          <div className="w-full py-24 flex flex-col items-center justify-center text-white/60">
            <svg className="animate-spin w-8 h-8 text-[#E50914] mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <span>Loading movie catalog…</span>
          </div>
        ) : currentMovies.length === 0 ? (
          <div className="w-full py-20 text-center text-white/60">
            <span className="text-4xl block mb-2">🎬</span>
            <p className="text-base font-semibold">No movies found matching &ldquo;{search}&rdquo;</p>
            <p className="text-xs text-white/40 mt-1">Try another search keyword.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {currentMovies.map((movie, idx) => (
              <MovieCard
                key={movie.id || idx}
                movie={movie}
                onSelect={onSelectMovie}
              />
            ))}
          </div>
        )}

        {/* Bottom Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10 pt-6 border-t border-[#262626]">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => {
                setCurrentPage(prev => Math.max(1, prev - 1));
                scrollToAbove();
              }}
              className="px-4 py-2 rounded-full bg-[#1f1f1f] hover:bg-[#282828] text-white text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              Previous Page
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    setCurrentPage(num);
                    scrollToAbove();
                  }}
                  className={`w-8 h-8 rounded-full text-xs font-bold transition cursor-pointer ${
                    currentPage === num
                      ? 'bg-[#E50914] text-white shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => {
                setCurrentPage(prev => Math.min(totalPages, prev + 1));
                scrollToAbove();
              }}
              className="px-4 py-2 rounded-full bg-[#1f1f1f] hover:bg-[#282828] text-white text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              Next Page
            </button>
          </div>
        )}
      </div>

      {/* Button for scroll to above (as requested: "on that page there should be a button for scroll to above") */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToAbove}
          aria-label="Scroll to top of catalog"
          title="Scroll to above"
          className="fixed bottom-6 right-6 z-50 p-3.5 rounded-full bg-[#E50914] hover:bg-[#b80710] text-white shadow-[0_4px_20px_rgba(229,9,20,0.6)] hover:-translate-y-1 active:translate-y-0 transition-all cursor-pointer animate-fadeIn"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div>
  );
}
