import MovieCard from './MovieCard';

export default function MoviePostersCollage({ movies = [], onSelectMovie }) {
  if (!movies || movies.length === 0) {
    return (
      <div className="w-full py-16 text-center text-white/60 border border-dashed border-white/10 rounded-2xl bg-[#181818]/50">
        <span className="text-4xl block mb-3">🎬</span>
        <p className="text-sm">No recommendations match your current filters.</p>
        <p className="text-xs text-white/40 mt-1">Try relaxing constraints or adjusting your mood / genre.</p>
      </div>
    );
  }

  // Display top 10 movies in clean responsive grid using the same beloved poster card
  const displayMovies = movies.slice(0, 10);

  return (
    <div className="relative w-full py-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5 w-full">
        {displayMovies.map((movie, idx) => (
          <MovieCard
            key={movie.id || movie.rank || idx}
            movie={movie}
            onSelect={onSelectMovie}
          />
        ))}
      </div>
    </div>
  );
}
