import { useState, useEffect } from 'react';
import { getJson } from '../utils';
import MovieCard from './MovieCard';

export default function KnowledgeBase({ onSelectMovie, onOpenFullCatalog }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function fetchCatalogSample() {
      setLoading(true);
      try {
        const data = await getJson('/api/movies?limit=15');
        setMovies(data.movies?.slice(0, 15) || []);
        setTotal(data.total || 9979);
      } catch (err) {
        console.error('Failed to load catalog sample:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCatalogSample();
  }, []);

  return (
    <section id="kb" className="wrap max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-[#262626]">
      {/* Header & 'See All Movies' Action Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
              <span className="w-2 h-5 bg-[#E50914] rounded-full inline-block"></span>
              <span>Movie Catalog</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#E50914] text-white font-bold">
                15 Featured
              </span>
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-white/70 mt-1">
            Browse high-rated films from our indexed 10,000 TMDB collection
          </p>
        </div>

        {/* Button to see all movies in new page */}
        <button
          type="button"
          onClick={onOpenFullCatalog}
          className="inline-flex items-center gap-2 bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-full shadow-[0_2px_14px_rgba(229,9,20,0.45)] hover:shadow-[0_4px_20px_rgba(229,9,20,0.6)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
        >
          <span>See All Movies</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/>
          </svg>
        </button>
      </div>

      {/* Grid of 15 Posters Only using unified MovieCard */}
      {loading ? (
        <div className="w-full py-20 flex flex-col items-center justify-center text-white/60">
          <svg className="animate-spin w-8 h-8 text-[#E50914] mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <span className="text-sm">Loading featured movie posters…</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-5">
          {movies.map((movie, idx) => (
            <MovieCard
              key={movie.id || idx}
              movie={movie}
              onSelect={onSelectMovie}
            />
          ))}
        </div>
      )}
    </section>
  );
}
