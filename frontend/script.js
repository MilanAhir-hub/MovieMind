// MovieMind frontend — plain JavaScript, no frameworks.
// It only collects preferences and displays results. All AI logic runs in the Python backend.

// When the page is served by Flask, the API is on the same address.
// When index.html is opened straight from disk, talk to the local Flask server instead.
const API_BASE = location.protocol === "file:" ? "http://127.0.0.1:5000" : "";

const $ = (id) => document.getElementById(id);

const CRITERION_NAMES = {
  genre: "Genre",
  language: "Language",
  mood: "Mood",
  duration: "Duration",
  rating: "Rating",
};

const EXAMPLES = {
  hindiAction: { genre: "Action", language: "Hindi", mood: "action-packed", max_duration: 160, min_rating: 7, max_rating: 10 },
  funnyShort:  { genre: "Any", language: "English", mood: "funny", max_duration: 120, min_rating: 7, max_rating: 10 },
  anyScary:    { genre: "Any", language: "Any", mood: "scary", max_duration: 180, min_rating: 6, max_rating: 10 },
  strict:      { genre: "Horror", language: "Korean", mood: "Any", max_duration: 90, min_rating: 8, max_rating: 10 },
};

let options = null;   // filled from GET /api/options

// ---------- small helpers ----------
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatRating(rating) {
  return Number(rating).toFixed(1);   // 9 -> "9.0"
}

async function getJson(path, init) {
  const response = await fetch(API_BASE + path, init);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed (HTTP ${response.status})`);
  }
  return data;
}

function showStatus(kind, html) {
  const box = $("status");
  box.className = "status" + (kind ? " " + kind : "");
  box.innerHTML = html;
}

// ---------- form ----------
function fillSelect(select, values, anyLabel) {
  select.innerHTML =
    `<option value="${escapeHtml(options.any)}">${escapeHtml(anyLabel)}</option>` +
    values.map((v) => `<option value="${escapeHtml(v)}">${escapeHtml(capitalize(v))}</option>`).join("");
}

function updateOutputs() {
  $("duration-out").textContent = `${$("max_duration").value} min`;
  const low = Number($("min_rating").value).toFixed(1);
  const high = Number($("max_rating").value).toFixed(1);
  $("rating-out").textContent = `${low} – ${high}`;
}

// keep min rating <= max rating while the user drags either slider
function keepRatingOrder(event) {
  const min = $("min_rating");
  const max = $("max_rating");
  if (Number(min.value) > Number(max.value)) {
    if (event.target === min) max.value = min.value;
    else min.value = max.value;
  }
  updateOutputs();
}

function readPreferences() {
  return {
    genre: $("genre").value,
    language: $("language").value,
    mood: $("mood").value,
    max_duration: Number($("max_duration").value),
    min_rating: Number($("min_rating").value),
    max_rating: Number($("max_rating").value),
  };
}

function applyPreferences(prefs) {
  for (const key of ["genre", "language", "mood", "max_duration", "min_rating", "max_rating"]) {
    $(key).value = prefs[key];
  }
  updateOutputs();
}

function renderWeights(weights) {
  $("weights-list").innerHTML = Object.entries(weights)
    .map(([name, points]) => `
      <li>
        <span>${CRITERION_NAMES[name]}</span>
        <span class="bar"><i style="width:${points}%"></i></span>
        <b>${points}</b>
      </li>`)
    .join("");
}

// ---------- results ----------
function labelClass(label) {
  return label.split(" ")[0].toLowerCase();   // "Excellent match" -> "excellent"
}

function renderCard(movie) {
  const chips =
    movie.genres.map((g) => `<span class="chip">${escapeHtml(g)}</span>`).join("") +
    movie.moods.map((m) => `<span class="chip mood">${escapeHtml(m)}</span>`).join("");

  const breakdown = movie.breakdown
    .map((c) => `
      <li class="${c.status}">
        <span class="crit">${CRITERION_NAMES[c.criterion]}</span>
        <span class="bar"><i style="width:${(c.points / c.max) * 100}%"></i></span>
        <span class="pts">${c.points}/${c.max}</span>
        <p class="why">${escapeHtml(c.reason)}</p>
      </li>`)
    .join("");

  const relaxed = movie.relaxed_rules.length
    ? `<div class="relaxed-note">Breaks the relaxed rule: ${movie.relaxed_rules
        .map((r) => `${escapeHtml(r.name)} (${r.id})`).join(", ")}</div>`
    : "";

  return `
    <article class="card" style="animation-delay:${(movie.rank - 1) * 70}ms">
      <div class="card-head">
        <span class="rank">#${movie.rank}</span>
        <div>
          <h3>${escapeHtml(movie.title)} <span class="year">${movie.year}</span></h3>
          <p class="meta">${escapeHtml(movie.language)} &middot; ${movie.duration} min &middot; &#9733; ${formatRating(movie.rating)}/10</p>
          <div class="chips">${chips}</div>
        </div>
        <div class="score-ring" style="--pct:${movie.score}" title="Match score">
          <div><b>${movie.score}</b><small>/100</small></div>
        </div>
      </div>
      <span class="match-label ${labelClass(movie.match_label)}">${escapeHtml(movie.match_label)}</span>
      <p class="summary">${escapeHtml(movie.summary)}</p>
      ${relaxed}
      <ul class="breakdown">${breakdown}</ul>
    </article>`;
}

function factChips(facts, inferredKeys) {
  const show = {
    genre: facts.genre,
    language: facts.language,
    mood: facts.mood,
    max_duration: `${facts.max_duration} min`,
    rating: `${facts.min_rating.toFixed(1)}–${facts.max_rating.toFixed(1)}`,
  };
  return Object.entries(show)
    .map(([key, value]) => {
      const tag = inferredKeys.includes(key) ? '<span class="tag">inferred</span>' : "";
      return `<span class="chip">${escapeHtml(key)} = ${escapeHtml(value)}${tag}</span>`;
    })
    .join("");
}

function renderTrace(trace) {
  const inferredKeys = Object.keys(trace.inferred_preferences)
    .filter((key) => trace.inferred_preferences[key] !== trace.preferences[key]);

  const inferenceHtml = trace.inference.length
    ? trace.inference.map((r) => `<code class="rule">${r.id}: ${escapeHtml(r.text)}</code>`).join("") +
      `<p>Facts after inference:</p><div class="facts">${factChips(trace.inferred_preferences, inferredKeys)}</div>`
    : "<p>No inference rule fired: nothing needed to be inferred from your preferences.</p>";

  const constraintHtml = trace.constraints
    .map((c) => `<code class="rule">${c.id}: ${escapeHtml(c.text)} &rarr; ${c.excluded} movie(s)${
      c.relaxed ? '<span class="tag">relaxed</span>' : ""}</code>`)
    .join("");

  const weights = Object.entries(options.weights)
    .map(([name, points]) => `${CRITERION_NAMES[name]} ${points}`).join(", ");

  const steps = [
    ["Knowledge representation",
      `<p>${trace.total_movies} movies are stored as frames (title, genres, language, moods, duration, rating),
       plus a semantic network of related genres and moods.</p>`],
    ["Working memory",
      `<p>Your preferences became the starting facts:</p>
       <div class="facts">${factChips(trace.preferences, [])}</div>`],
    ["Forward chaining (inference rules)", inferenceHtml],
    ["Constraint rules (IF-THEN filters)",
      `${constraintHtml}<p>${trace.passed_all_rules} of ${trace.total_movies} movies passed every rule.</p>`],
    ["Constraint relaxation",
      `<p>${escapeHtml(trace.relaxation_message || `Not needed: at least ${options.top_k} movies passed every rule.`)}</p>`],
    ["Heuristic evaluation",
      `<p>${trace.candidates} candidate movies were scored out of 100 (weights: ${weights}).
       Related genres and moods earn half points.</p>`],
    ["Best-first selection",
      `<p>All candidates went into a priority queue ordered by score, then fewest broken rules, then rating.
       The top ${trace.selected} were popped and are shown above.</p>`],
  ];

  $("trace-steps").innerHTML = steps
    .map(([title, body]) => `<li><h4>${title}</h4>${body}</li>`)
    .join("");
  $("trace").hidden = false;
}

async function recommend(event) {
  if (event) event.preventDefault();
  const button = $("submit-btn");
  button.disabled = true;
  showStatus("", "Reasoning&hellip;");

  try {
    const data = await getJson("/api/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(readPreferences()),
    });

    $("results").innerHTML = data.recommendations.map(renderCard).join("");
    renderTrace(data.trace);

    if (data.trace.relaxation_message) {
      showStatus("warn", `<strong>Filters relaxed.</strong> ${escapeHtml(data.trace.relaxation_message)}`);
    } else {
      showStatus("", `Top ${data.recommendations.length} of <strong>${data.trace.candidates}</strong>
        movies that passed your rules. Scores are out of 100.`);
    }
  } catch (error) {
    showStatus("error", `Could not get recommendations: ${escapeHtml(error.message)}`);
  } finally {
    button.disabled = false;
  }
}

// ---------- knowledge base table ----------
let kbLoaded = false;

async function loadKnowledgeBase() {
  if (kbLoaded || !$("kb").open) return;
  kbLoaded = true;
  try {
    const movies = await getJson("/api/movies");
    $("kb-count").textContent = `(${movies.length} movies)`;
    $("kb-body").innerHTML = movies
      .map((m) => `
        <tr>
          <td>${m.id}</td>
          <td>${escapeHtml(m.title)}</td>
          <td>${m.year}</td>
          <td>${escapeHtml(m.language)}</td>
          <td>${escapeHtml(m.genres.join(", "))}</td>
          <td>${escapeHtml(m.moods.join(", "))}</td>
          <td>${m.duration}</td>
          <td>${formatRating(m.rating)}</td>
        </tr>`)
      .join("");
  } catch (error) {
    kbLoaded = false;
    $("kb-body").innerHTML = `<tr><td colspan="8">Could not load: ${escapeHtml(error.message)}</td></tr>`;
  }
}

// ---------- start-up ----------
async function init() {
  try {
    options = await getJson("/api/options");
  } catch (error) {
    showStatus("error", `Cannot reach the backend. Start it with <code>python app.py</code> inside the
      <code>backend</code> folder, then open <code>http://127.0.0.1:5000</code>.`);
    return;
  }

  fillSelect($("genre"), options.genres, "Any genre");
  fillSelect($("language"), options.languages, "Any language");
  fillSelect($("mood"), options.moods, "Any mood");
  renderWeights(options.weights);
  updateOutputs();

  $("prefs-form").addEventListener("submit", recommend);
  $("prefs-form").addEventListener("reset", () => setTimeout(updateOutputs));   // after the browser resets values
  $("max_duration").addEventListener("input", updateOutputs);
  $("min_rating").addEventListener("input", keepRatingOrder);
  $("max_rating").addEventListener("input", keepRatingOrder);
  $("kb").addEventListener("toggle", loadKnowledgeBase);

  document.querySelectorAll("[data-example]").forEach((button) => {
    button.addEventListener("click", () => {
      applyPreferences(EXAMPLES[button.dataset.example]);
      recommend();
    });
  });
}

init();
