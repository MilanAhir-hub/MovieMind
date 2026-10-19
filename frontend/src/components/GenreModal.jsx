import { useState, useEffect } from 'react';

const GENRE_LIST = [
  { label: 'All Genres', genre: 'Any', icon: '🎬', desc: 'Browse without genre restriction' },
  { label: 'Action', genre: 'Action', icon: '💥', desc: 'High-octane fights & explosions' },
  { label: 'Sci-Fi', genre: 'Sci-Fi', icon: '🚀', desc: 'Space, futuristic tech & science' },
  { label: 'Thriller', genre: 'Thriller', icon: '⚡', desc: 'High tension, suspense & twists' },
  { label: 'Comedy', genre: 'Comedy', icon: '😂', desc: 'Laugh-out-loud funny & feel-good' },
  { label: 'Drama', genre: 'Drama', icon: '🎭', desc: 'Emotional depth & human stories' },
  { label: 'Horror', genre: 'Horror', icon: '👻', desc: 'Chills, scares & eerie mysteries' },
  { label: 'Romance', genre: 'Romance', icon: '❤️', desc: 'Love, passion & heartfelt journeys' },
  { label: 'Adventure', genre: 'Adventure', icon: '🗺️', desc: 'Epic quests & exciting expeditions' },
  { label: 'Crime', genre: 'Crime', icon: '🕵️', desc: 'Detectives, heists & investigations' },
  { label: 'Animation', genre: 'Animation', icon: '🎨', desc: 'Animated masterpieces for all ages' },
  { label: 'Fantasy', genre: 'Fantasy', icon: '🧙', desc: 'Magic, mythical realms & mythology' },
];

export default function GenreModal({ isOpen, onClose, activeGenre, onApplyGenre }) {
  const [selected, setSelected] = useState(activeGenre || 'Any');

  useEffect(() => {
    setSelected(activeGenre || 'Any');
  }, [activeGenre, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function handleApply() {
    onApplyGenre(selected);
    onClose();
    setTimeout(() => {
      document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="genre-modal-title"
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#181818] border border-[#2e2e2e] rounded-2xl shadow-2xl text-white p-6 sm:p-8 animate-scaleUp no-scrollbar"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with Title and Close Button */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#2e2e2e]">
          <div>
            <h2 id="genre-modal-title" className="text-xl font-bold text-white flex items-center gap-2.5">
              <span className="w-2 h-5 bg-[#E50914] rounded-full inline-block"></span>
              Select Quick Genre
            </h2>
            <p className="text-xs sm:text-sm text-white/90 font-medium mt-1">
              Filter top recommended movies by your favorite cinematic genre
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-white hover:text-white/80 bg-white/10 hover:bg-[#E50914] p-2 rounded-full transition-colors cursor-pointer"
            title="Close modal"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Genre Grid Options */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-2">
          {GENRE_LIST.map(({ label, genre, icon, desc }) => {
            const isSelected = selected === genre;
            return (
              <button
                key={genre}
                type="button"
                onClick={() => setSelected(genre)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[82px] ${
                  isSelected
                    ? 'bg-[#E50914] border-[#E50914] text-white shadow-[0_4px_16px_rgba(229,9,20,0.4)] scale-[1.02]'
                    : 'bg-[#1f1f1f] border-[#2e2e2e] text-white hover:border-[#555] hover:bg-[#252525]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">{icon}</span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-white shadow-sm"></span>
                  )}
                </div>
                <div>
                  <div className="font-bold text-sm text-white">{label}</div>
                  <div className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-white/90' : 'text-white/60'}`}>
                    {desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer with Reset and Red Apply Button */}
        <div className="flex items-center justify-between pt-5 mt-5 border-t border-[#2e2e2e]">
          <button
            type="button"
            onClick={() => setSelected('Any')}
            className="text-xs font-semibold text-white/80 hover:text-white transition-colors cursor-pointer px-3 py-2 rounded-lg hover:bg-white/5"
          >
            Reset to All
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold text-white/80 hover:text-white px-5 py-2.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center justify-center gap-2 bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-xs sm:text-sm px-7 py-2.5 rounded-full shadow-[0_2px_14px_rgba(229,9,20,0.5)] hover:shadow-[0_4px_20px_rgba(229,9,20,0.65)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
              <span>Apply Genre</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
