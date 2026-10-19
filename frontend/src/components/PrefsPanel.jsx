import { useState, useEffect } from 'react';
import { CRITERION_NAMES, EXAMPLES, capitalize, getSliderBackground } from '../utils';
import { CRITERION_ICONS } from '../icons';

// Default preferences matching the recommendation engine
const DEFAULT_PREFS = {
  genre: 'Any',
  language: 'Any',
  mood: 'Any',
  max_duration: 180,
  min_rating: 6,
  max_rating: 10,
};

export default function PrefsPanel({
  isOpen,
  onClose,
  options,
  onSubmit,
  activeGenre,
  onGenreChange,
}) {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync active genre from quick genres rail
  useEffect(() => {
    if (activeGenre) {
      setPrefs(prev => ({ ...prev, genre: activeGenre }));
    }
  }, [activeGenre]);

  // Lock body scroll and listen for Escape key when open
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      }
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

  // Update slider gradient tracks
  function updateSliderBg(id, value, min, max, color) {
    const el = document.getElementById(id);
    if (el) el.style.background = getSliderBackground(value, min, max, color);
  }

  useEffect(() => {
    if (isOpen) {
      updateSliderBg('modal_max_duration', prefs.max_duration, 60, 240, '#E50914');
      updateSliderBg('modal_min_rating', prefs.min_rating, 0, 10, '#46d369');
      updateSliderBg('modal_max_rating', prefs.max_rating, 0, 10, '#46d369');
    }
  }, [isOpen, prefs.max_duration, prefs.min_rating, prefs.max_rating]);

  function handleChange(key, value) {
    setPrefs(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'min_rating' && Number(value) > Number(next.max_rating)) {
        next.max_rating = value;
      }
      if (key === 'max_rating' && Number(value) < Number(next.min_rating)) {
        next.min_rating = value;
      }
      if (key === 'genre' && onGenreChange) {
        onGenreChange(value);
      }
      return next;
    });
  }

  async function handleApply(e) {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        genre: prefs.genre,
        language: prefs.language,
        mood: prefs.mood,
        max_duration: Number(prefs.max_duration),
        min_rating: Number(prefs.min_rating),
        max_rating: Number(prefs.max_rating),
      });
      onClose();
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    const resetPrefs = { ...DEFAULT_PREFS };
    if (options?.defaults) {
      Object.assign(resetPrefs, {
        genre: options.any || 'Any',
        language: options.any || 'Any',
        mood: options.any || 'Any',
      });
    }
    setPrefs(resetPrefs);
    if (onGenreChange) {
      onGenreChange(resetPrefs.genre);
    }
  }

  function applyPreset(key) {
    const preset = EXAMPLES[key];
    if (!preset) return;
    setPrefs(preset);
    if (onGenreChange) {
      onGenreChange(preset.genre);
    }
  }

  if (!isOpen) return null;

  const genres = options ? [options.any, ...options.genres] : ['Any'];
  const languages = options ? [options.any, ...options.languages] : ['Any'];
  const moods = options ? [options.any, ...options.moods] : ['Any'];
  const weights = options?.weights || {};

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="filter-modal-title"
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#181818] border border-[#2e2e2e] rounded-2xl shadow-2xl text-white p-6 sm:p-8 animate-scaleUp no-scrollbar"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with Title and Close Button */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#2e2e2e]">
          <div>
            <h2 id="filter-modal-title" className="text-xl font-bold text-white flex items-center gap-2.5">
              <span className="w-2 h-5 bg-[#E50914] rounded-full inline-block"></span>
              Movie Filter Studio
            </h2>
            <p className="text-xs sm:text-sm text-white/90 font-medium mt-1">
              Customize AI rules, constraints &amp; heuristic scoring criteria
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 bg-[#242424] text-white rounded-md border border-[#444444]">
              Symbolic AI Rules
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-white hover:text-white/80 bg-white/10 hover:bg-[#E50914] p-2 rounded-full transition-colors cursor-pointer"
              title="Close filter modal"
              aria-label="Close filter modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleApply} className="space-y-6">
          {/* Row 1: Dropdown Selectors (Genre, Language, Vibe/Mood) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Genre */}
            <div className="field">
              <label htmlFor="modal_genre" className="block text-xs font-semibold uppercase tracking-wider text-white mb-1.5">
                Genre
              </label>
              <div className="select-wrapper relative">
                <select
                  id="modal_genre"
                  className="custom-select"
                  value={prefs.genre}
                  onChange={e => handleChange('genre', e.target.value)}
                >
                  {genres.map(g => (
                    <option key={g} value={g}>
                      {g === options?.any ? 'Any genre' : capitalize(g)}
                    </option>
                  ))}
                </select>
                <svg className="select-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
            </div>

            {/* Language */}
            <div className="field">
              <label htmlFor="modal_language" className="block text-xs font-semibold uppercase tracking-wider text-white mb-1.5">
                Language
              </label>
              <div className="select-wrapper relative">
                <select
                  id="modal_language"
                  className="custom-select"
                  value={prefs.language}
                  onChange={e => handleChange('language', e.target.value)}
                >
                  {languages.map(l => (
                    <option key={l} value={l}>
                      {l === options?.any ? 'Any language' : capitalize(l)}
                    </option>
                  ))}
                </select>
                <svg className="select-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
            </div>

            {/* Vibe / Mood */}
            <div className="field">
              <label htmlFor="modal_mood" className="block text-xs font-semibold uppercase tracking-wider text-white mb-1.5">
                Vibe / Mood
              </label>
              <div className="select-wrapper relative">
                <select
                  id="modal_mood"
                  className="custom-select"
                  value={prefs.mood}
                  onChange={e => handleChange('mood', e.target.value)}
                >
                  {moods.map(m => (
                    <option key={m} value={m}>
                      {m === options?.any ? 'Any mood' : capitalize(m)}
                    </option>
                  ))}
                </select>
                <svg className="select-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Row 2: Sliders (Duration & Rating Range) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
            {/* Max Duration */}
            <div className="bg-[#1f1f1f] border border-[#2b2b2b] rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="modal_max_duration" className="text-xs font-semibold uppercase tracking-wider text-white">
                  Max Duration
                </label>
                <output className="text-xs font-bold px-2.5 py-0.5 rounded bg-[#E50914]/20 border border-[#E50914]/40 text-white">
                  {prefs.max_duration} min
                </output>
              </div>
              <input
                type="range"
                id="modal_max_duration"
                min={60}
                max={240}
                step={5}
                value={prefs.max_duration}
                className="netflix-range my-2"
                aria-label="Maximum duration in minutes"
                onChange={e => handleChange('max_duration', Number(e.target.value))}
              />
              <div className="flex justify-between text-[11px] text-white/90 font-medium">
                <span>1 hr</span>
                <span>2.5 hr</span>
                <span>4 hr</span>
              </div>
            </div>

            {/* Rating Range */}
            <div className="bg-[#1f1f1f] border border-[#2b2b2b] rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-white">
                  Rating Range
                </span>
                <output className="text-xs font-bold px-2.5 py-0.5 rounded bg-[#46d369]/20 border border-[#46d369]/40 text-white">
                  {Number(prefs.min_rating).toFixed(1)} – {Number(prefs.max_rating).toFixed(1)}
                </output>
              </div>
              <div className="space-y-2 mt-2">
                <div className="slider-row flex items-center gap-3">
                  <small className="text-xs text-white font-semibold w-8">Min</small>
                  <input
                    type="range"
                    id="modal_min_rating"
                    min={0}
                    max={10}
                    step={0.5}
                    value={prefs.min_rating}
                    className="netflix-range flex-1"
                    aria-label="Minimum rating"
                    onChange={e => handleChange('min_rating', Number(e.target.value))}
                  />
                </div>
                <div className="slider-row flex items-center gap-3">
                  <small className="text-xs text-white font-semibold w-8">Max</small>
                  <input
                    type="range"
                    id="modal_max_rating"
                    min={0}
                    max={10}
                    step={0.5}
                    value={prefs.max_rating}
                    className="netflix-range flex-1"
                    aria-label="Maximum rating"
                    onChange={e => handleChange('max_rating', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Quick Curated Presets */}
          <div className="pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[#E50914]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              Quick Presets
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { key: 'hindiAction', icon: '🎬', label: 'Hindi Action' },
                { key: 'funnyShort',  icon: '😂', label: 'Funny < 2h' },
                { key: 'anyScary',   icon: '👻', label: 'Midnight Horror' },
                { key: 'strict',     icon: '⚡', label: 'Stress-Test' },
              ].map(({ key, icon, label }) => (
                <button
                  key={key}
                  type="button"
                  className="preset-btn justify-center"
                  onClick={() => applyPreset(key)}
                >
                  <span className="preset-icon">{icon}</span>
                  <span className="text-white font-semibold">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Row 4: Scoring Weights Breakdown (Collapsible) */}
          <details className="weights-details border-t border-[#2e2e2e] pt-3 group">
            <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-white hover:text-white/90 flex items-center justify-between transition-colors list-none py-1">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#E50914]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                <span>Scoring Weights (100 Pts Breakdown)</span>
              </span>
              <span className="text-xs text-white/80 group-open:rotate-180 transition-transform duration-200">▼</span>
            </summary>
            <div className="pt-3">
              <p className="text-xs text-white font-medium mb-2.5">
                Evaluator points assigned to matching candidate attributes:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(weights).map(([name, points]) => (
                  <div key={name} className="weight-row">
                    <span className="text-white font-medium flex items-center gap-2 text-xs">
                      {CRITERION_ICONS[name]}
                      <span>{CRITERION_NAMES[name] || name}</span>
                    </span>
                    <span className="weight-pts">{points} pts</span>
                  </div>
                ))}
              </div>
            </div>
          </details>

          {/* Footer Action Bar with Reset, Cancel, and Red Apply Button */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-5 border-t border-[#2e2e2e]">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-semibold text-white/80 hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              <span>Reset to Defaults</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none text-xs font-bold text-white/80 hover:text-white px-5 py-2.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-xs sm:text-sm px-7 py-2.5 rounded-full shadow-[0_2px_14px_rgba(229,9,20,0.5)] hover:shadow-[0_4px_20px_rgba(229,9,20,0.65)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-wait"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span>{isSubmitting ? 'Applying...' : 'Apply Filters'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
