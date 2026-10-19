// Explainability Trace Panel — matches original #trace details element from HTML/script.js
import { CRITERION_NAMES } from '../utils';

function factChips(facts, inferredKeys) {
  const show = {
    genre: facts.genre,
    language: facts.language,
    mood: facts.mood,
    max_duration: `${facts.max_duration} min`,
    rating: `${facts.min_rating.toFixed(1)}–${facts.max_rating.toFixed(1)}`,
  };
  return Object.entries(show).map(([key, value]) => {
    const isInferred = inferredKeys.includes(key);
    return (
      <span key={key} className="chip">
        {key} = {value}
        {isInferred && <span className="tag">inferred</span>}
      </span>
    );
  });
}

export default function TracePanel({ trace, options }) {
  if (!trace) return null;

  const inferredKeys = Object.keys(trace.inferred_preferences)
    .filter(key => trace.inferred_preferences[key] !== trace.preferences[key]);

  const n = num => num.toLocaleString();

  const weights = options?.weights
    ? Object.entries(options.weights).map(([name, pts]) => `${CRITERION_NAMES[name]} ${pts}`).join(', ')
    : '';

  const steps = [
    {
      title: 'Knowledge Representation (Frames & Semantic Network)',
      body: (
        <p>{n(trace.total_movies)} movies are stored as AI frames (slots: title, genres, language, moods, duration,
          rating, votes), linked by a semantic network of related genres and moods.</p>
      ),
    },
    {
      title: 'Working Memory Initialization',
      body: (
        <>
          <p>Your preferences were asserted into working memory as active facts:</p>
          <div className="facts">{factChips(trace.preferences, [])}</div>
        </>
      ),
    },
    {
      title: 'Forward Chaining (Inference Engine)',
      body: trace.inference.length ? (
        <>
          {trace.inference.map(r => (
            <code key={r.id} className="rule">{r.id}: {r.text}</code>
          ))}
          <p className="mt-2 text-xs text-[#808080]">Facts after forward-chaining inference:</p>
          <div className="facts">{factChips(trace.inferred_preferences, inferredKeys)}</div>
        </>
      ) : (
        <p>No inference rule fired: nothing needed to be inferred from your preferences.</p>
      ),
    },
    {
      title: 'Constraint Rules (IF-THEN Filtering)',
      body: (
        <>
          {trace.constraints.map(c => (
            <code key={c.id} className="rule">
              {c.id}: {c.text} → {n(c.excluded)} movie(s)
              {c.relaxed && <span className="tag">relaxed</span>}
            </code>
          ))}
          <p className="mt-2 text-xs text-[#808080]">
            {n(trace.passed_all_rules)} of {n(trace.total_movies)} movies satisfied all active constraint rules.
          </p>
        </>
      ),
    },
    {
      title: 'Constraint Relaxation (Adaptive Fallback)',
      body: (
        <p>{trace.relaxation_message || `Not needed: at least ${options?.top_k} movies passed every constraint.`}</p>
      ),
    },
    {
      title: 'Multi-Criteria Heuristic Evaluation',
      body: (
        <p>
          {n(trace.candidates)} candidate movies scored out of 100 points (Weights: {weights}).
          Near matches in semantic network earn proportional half-points.
        </p>
      ),
    },
    {
      title: 'Best-First Selection (Priority Queue)',
      body: (
        <p>
          All candidates were inserted into a best-first priority queue ordered by total heuristic score,
          then fewest broken rules, then IMDb Bayesian weighted vote rating. The top {trace.selected} were popped.
        </p>
      ),
    },
  ];

  return (
    <details id="trace" className="panel trace mt-8 bg-[#181818] border border-[#2b2b2b] rounded-2xl p-6 shadow-xl" open>
      <summary className="cursor-pointer text-base font-bold text-white flex items-center justify-between list-none">
        <span className="flex items-center gap-2.5">
          <svg className="w-5 h-5 text-[#E50914]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
          <span>Explainable AI Reasoning Trace</span>
        </span>
        <span className="trace-badge text-xs px-2.5 py-1 rounded-full bg-[#242424] border border-[#333333] text-[#B3B3B3]">Full Transparency</span>
      </summary>
      <div className="trace-desc text-xs text-[#808080] mt-2 mb-4">
        Every step the symbolic engine took to filter 10,000 movies down to your top 5 matches.
      </div>
      <ol id="trace-steps" className="trace-steps space-y-4 pt-2 border-t border-[#2e2e2e]">
        {steps.map(({ title, body }) => (
          <li key={title}>
            <h4>{title}</h4>
            {body}
          </li>
        ))}
      </ol>
    </details>
  );
}
