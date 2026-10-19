import { useState, useEffect } from 'react';
import { getJson } from './utils';

import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import GenreRail from './components/GenreRail';
import GenreModal from './components/GenreModal';
import PrefsPanel from './components/PrefsPanel';
import StatusBanner from './components/StatusBanner';
import MoviePostersCollage from './components/MoviePostersCollage';
import MovieModal from './components/MovieModal';
import FullCatalogModal from './components/FullCatalogModal';
import TracePanel from './components/TracePanel';
import KnowledgeBase from './components/KnowledgeBase';
import ScrollToTop from './components/ScrollToTop';
import Footer from './components/Footer';

export default function App() {
  const [options, setOptions] = useState(null);
  const [optionsError, setOptionsError] = useState(false);

  const [recommendations, setRecommendations] = useState([]);
  const [trace, setTrace] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);

  const [statusKind, setStatusKind] = useState('');
  const [statusContent, setStatusContent] = useState(null);
  const [loading, setLoading] = useState(false);

  const [activeGenre, setActiveGenre] = useState('Any');
  const [isPrefsOpen, setIsPrefsOpen] = useState(false);
  const [isGenreModalOpen, setIsGenreModalOpen] = useState(false);
  const [isFullCatalogOpen, setIsFullCatalogOpen] = useState(false);

  function handleOpenPrefs() {
    setIsPrefsOpen(true);
  }

  function handleClosePrefs() {
    setIsPrefsOpen(false);
  }

  // Load API options on mount
  useEffect(() => {
    getJson('/api/options')
      .then(data => {
        setOptions(data);
        // Auto-run initial recommendation
        recommend({
          genre: data.any,
          language: data.any,
          mood: data.any,
          max_duration: 180,
          min_rating: 6,
          max_rating: 10,
        });
      })
      .catch(() => {
        setOptionsError(true);
        setStatusKind('error');
        setStatusContent(
          <>Cannot reach backend API. Ensure <code>python app.py</code> is running in <code>backend/</code>.</>
        );
      });
  }, []);

  // Default status
  useEffect(() => {
    if (!optionsError && !loading && recommendations.length === 0 && !trace) {
      setStatusKind('');
      setStatusContent(
        <>Choose your preferences and press <strong>Recommend movies</strong>.</>
      );
    }
  }, [optionsError]);

  async function recommend(prefs) {
    setLoading(true);
    setStatusKind('');
    setStatusContent(
      <span className="flex items-center gap-2">
        <svg className="animate-spin w-4 h-4 text-[#E50914]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        Evaluating symbolic rules and heuristic weights…
      </span>
    );

    try {
      const data = await getJson('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });

      setRecommendations(data.recommendations);
      setTrace(data.trace);

      if (data.trace.relaxation_message) {
        setStatusKind('warn');
        setStatusContent(
          <><strong>Constraints Relaxed:</strong> {data.trace.relaxation_message}</>
        );
      } else {
        setStatusKind('');
        setStatusContent(
          <>Selected top {data.recommendations.length} picks from{' '}
          <strong>{data.trace.candidates.toLocaleString()}</strong> eligible candidates. Scores evaluated out of 100.</>
        );
      }
    } catch (err) {
      setStatusKind('error');
      setStatusContent(<>Could not get recommendations: {err.message}</>);
    } finally {
      setLoading(false);
    }
  }

  function handleGenreClick(genre) {
    setActiveGenre(genre);
    if (options) {
      recommend({
        genre,
        language: options.any,
        mood: options.any,
        max_duration: 180,
        min_rating: 6,
        max_rating: 10,
      });
    }
  }

  function handleGenreChange(genre) {
    setActiveGenre(genre);
  }

  function handleBrowseCatalog() {
    setIsFullCatalogOpen(true);
  }

  return (
    <div className="bg-[#141414] text-[#E5E5E5] font-sans antialiased selection:bg-[#E50914] selection:text-white min-h-screen">
      <Navbar movieCount={options?.movie_count} onOpenPrefs={handleOpenPrefs} />

      <HeroSection onBrowseCatalog={handleBrowseCatalog} />

      <GenreRail
        onOpenFilters={handleOpenPrefs}
        onOpenGenreModal={() => setIsGenreModalOpen(true)}
      />

      {/* Main Workspace: Recommendations & Reasoning (Full Width) */}
      <main className="wrap max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <section id="results-section" className="results-panel w-full min-w-0" aria-live="polite">

          {/* Status Message Banner */}
          <StatusBanner kind={statusKind}>
            {statusContent}
          </StatusBanner>

          {/* Result Cards Container Header */}
          <div className="section-heading flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <span>Top Picks For You</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#E50914] text-white">Top 10</span>
              </h2>

              {/* Red Filter Button */}
              <button
                type="button"
                onClick={handleOpenPrefs}
                className="inline-flex items-center gap-2 bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-xs sm:text-sm px-4 py-1.5 rounded-full shadow-[0_2px_12px_rgba(229,9,20,0.45)] hover:shadow-[0_4px_16px_rgba(229,9,20,0.6)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                title="Open Movie Filters"
              >
                <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
                </svg>
                <span>Filters</span>
              </button>
            </div>

            <span className="text-xs text-white/60">
              Ranked by symbolic constraints &amp; heuristic weight scores
            </span>
          </div>

          {/* 10-Movie Posters Grid (No Extreme Zoom Effect) */}
          <div id="results" className={`transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
            <MoviePostersCollage
              movies={recommendations}
              onSelectMovie={setSelectedMovie}
            />
          </div>

          {/* Explainability Trace */}
          {trace && <TracePanel trace={trace} options={options} />}
        </section>
      </main>

      {/* Featured Movie Catalog (15 Posters Only + 'See All Movies' Button) */}
      <KnowledgeBase
        onSelectMovie={setSelectedMovie}
        onOpenFullCatalog={() => setIsFullCatalogOpen(true)}
      />

      {/* Quick Genres Modal (Genre selection cards with Apply button) */}
      <GenreModal
        isOpen={isGenreModalOpen}
        onClose={() => setIsGenreModalOpen(false)}
        activeGenre={activeGenre}
        onApplyGenre={handleGenreClick}
      />

      {/* Movie Filter Studio Modal (Preferences modal with Apply button) */}
      <PrefsPanel
        isOpen={isPrefsOpen}
        onClose={handleClosePrefs}
        options={options}
        onSubmit={recommend}
        activeGenre={activeGenre}
        onGenreChange={handleGenreChange}
      />

      {/* Full Movie Catalog Page Modal (100 movies, pagination of 20, scroll to above) */}
      <FullCatalogModal
        isOpen={isFullCatalogOpen}
        onClose={() => setIsFullCatalogOpen(false)}
        onSelectMovie={setSelectedMovie}
      />

      {/* Movie Details & AI Decision Factors Modal */}
      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
        />
      )}

      {/* Floating Bottom-Right Arrow for Scrolling to Above */}
      <ScrollToTop />

      <Footer />
    </div>
  );
}
