import { useState } from 'react';
import { formatRating } from '../utils';

export default function MovieCard({ movie, rank, onSelect, showMatchScore = false }) {
  const [imgError, setImgError] = useState(false);
  const posterUrl = movie.poster_url || movie.poster;
  const initial = (movie.title || 'M').charAt(0).toUpperCase();

  let scoreTierClass = 'text-[#46d369] border-[#46d369]/30 bg-black/75';
  if (movie.score !== undefined) {
    if (movie.score < 50) {
      scoreTierClass = 'text-[#E50914] border-[#E50914]/30 bg-black/75';
    } else if (movie.score < 80) {
      scoreTierClass = 'text-[#ffb800] border-[#ffb800]/30 bg-black/75';
    }
  }

  return (
    <div
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onSelect) onSelect(movie);
      }}
      className="group relative flex flex-col rounded-xl overflow-hidden bg-[#181818] border border-white/10 hover:border-white/30 shadow-md hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-200 cursor-pointer"
      title={`${movie.title} (${movie.year || ''}) - Click for details`}
    >
      {/* Poster with aspect 2/3 */}
      <div className="relative w-full aspect-[2/3] bg-[#0d0d0d] overflow-hidden">
        {/* Optional Rank Badge on top-left */}
        {rank !== undefined && (
          <div className="absolute top-2 left-2 z-10">
            <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-[#E50914] text-white font-extrabold text-xs shadow-md">
              #{rank}
            </span>
          </div>
        )}

        {/* Top-Right Badge: Match % or Rating */}
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
          {showMatchScore && movie.score !== undefined ? (
            <span className={`px-2 py-0.5 rounded-md backdrop-blur-md text-xs font-bold border shadow-md ${scoreTierClass}`}>
              {movie.score}% Match
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[#ffb800] text-xs font-bold border border-white/10 shadow-sm">
              ★ {formatRating(movie.rating)}
            </span>
          )}
        </div>

        {/* Poster Artwork */}
        {posterUrl && !imgError ? (
          <img
            src={posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-[#222]">
            <span className="text-3xl mb-1">🎬</span>
            <span className="font-bold text-base text-[#E50914]">{initial}</span>
            <span className="text-xs text-white/70 line-clamp-2 mt-1">{movie.title}</span>
          </div>
        )}

        {/* Gradient overlay for bottom title hint */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/95 via-black/50 to-transparent flex items-end p-2.5 pointer-events-none">
          <div className="w-full">
            <span className="text-xs font-semibold text-white truncate block w-full group-hover:text-[#E50914] transition-colors">
              {movie.title}
            </span>
            {movie.year && (
              <span className="text-[10px] text-white/60 block mt-0.5">
                {movie.year} {movie.language ? `• ${movie.language}` : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
