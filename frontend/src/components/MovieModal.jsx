import { useEffect } from 'react';
import { formatRating, formatVotes } from '../utils';

export default function MovieModal({ movie, onClose }) {
  useEffect(() => {
    if (!movie) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);

    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
    };
  }, [movie, onClose]);

  if (!movie) return null;

  const posterUrl = movie.poster_url || movie.poster;
  const votes = movie.votes ? ` (${formatVotes(movie.votes)} votes)` : '';
  const desc = movie.description || movie.overview;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#181818] border border-[#2e2e2e] rounded-2xl shadow-2xl text-white p-6 sm:p-8 animate-scaleUp no-scrollbar"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 hover:bg-[#E50914] text-white/80 hover:text-white transition cursor-pointer"
          aria-label="Close details"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header & Poster */}
        <div className="flex flex-col sm:flex-row gap-6 mb-6">
          <div className="shrink-0 w-36 sm:w-44 aspect-[2/3] rounded-xl overflow-hidden shadow-xl border border-white/10 bg-black">
            {posterUrl ? (
              <img src={posterUrl} alt={movie.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#242424] text-[#808080]">
                <span className="text-3xl">🎬</span>
                <span className="font-bold text-sm mt-1">{movie.title}</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-[#E50914] text-white font-bold text-xs tracking-wider">
                  TMDB INDEXED
                </span>
                <span className="text-sm font-bold text-[#ffb800] flex items-center gap-1">
                  ★ {formatRating(movie.rating)}/10
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                {movie.title} <span className="text-[#808080] font-normal text-xl">({movie.year})</span>
              </h2>

              <div className="flex flex-wrap items-center gap-2 mb-3 text-sm text-[#B3B3B3]">
                <span className="px-2 py-0.5 rounded bg-[#2a2a2a] text-white">{movie.language}</span>
                <span className="px-2 py-0.5 rounded bg-[#2a2a2a] text-white">{movie.duration} min</span>
                <span className="text-[#ffb800] font-bold">★ {formatRating(movie.rating)}/10{votes}</span>
                {movie.tmdb_id && (
                  <a
                    href={`https://www.themoviedb.org/movie/${movie.tmdb_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#E50914] hover:underline font-semibold ml-2"
                  >
                    TMDb ↗
                  </a>
                )}
                {movie.imdb_id && (
                  <a
                    href={`https://www.imdb.com/title/${movie.imdb_id}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#ffb800] hover:underline font-semibold ml-1"
                  >
                    IMDb ↗
                  </a>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {movie.genres?.map(g => (
                  <span key={g} className="chip">{g}</span>
                ))}
                {movie.moods?.map(m => (
                  <span key={m} className="chip mood">{m}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Storyline / Overview */}
        {desc && (
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#808080] mb-1">Storyline</h4>
            <p className="text-[#E5E5E5] text-sm leading-relaxed">{desc}</p>
          </div>
        )}

        {/* Catalog Information & Specifications */}
        <div className="match-breakdown-panel border border-[#2e2e2e] rounded-xl p-4 bg-[#141414]">
          <div className="breakdown-header flex items-center justify-between pb-3 mb-3 border-b border-[#2e2e2e]">
            <span className="breakdown-header-title flex items-center gap-2 font-bold text-sm text-white">
              <svg className="w-4 h-4 text-[#E50914]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Catalog Information &amp; Specifications
            </span>
            <span className="text-xs text-[#b3b3b3]">
              TMDb ID: <strong className="text-white text-sm">{movie.tmdb_id || movie.id}</strong>
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-[#1f1f1f] p-3 rounded-lg border border-white/5">
              <span className="text-white/50 block mb-1">Audience Rating</span>
              <span className="text-[#ffb800] font-bold text-sm">★ {formatRating(movie.rating)} / 10</span>
              {votes && <span className="text-white/40 block text-[10px] mt-0.5">{votes}</span>}
            </div>
            <div className="bg-[#1f1f1f] p-3 rounded-lg border border-white/5">
              <span className="text-white/50 block mb-1">Runtime</span>
              <span className="text-white font-bold text-sm">{movie.duration} minutes</span>
            </div>
            <div className="bg-[#1f1f1f] p-3 rounded-lg border border-white/5">
              <span className="text-white/50 block mb-1">Language</span>
              <span className="text-white font-bold text-sm">{movie.language}</span>
            </div>
            <div className="bg-[#1f1f1f] p-3 rounded-lg border border-white/5">
              <span className="text-white/50 block mb-1">Release Year</span>
              <span className="text-white font-bold text-sm">{movie.year}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
