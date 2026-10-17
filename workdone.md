# Work Done Log — AI Movie Recommendation System

> Keep this file updated. Add a new dated entry at the top of **Log** every time you change the project.
> Status keys: ✅ done · 🔄 in progress · ⬜ not started

---

## Current Status

| # | Milestone | Status | Files |
| --- | --- | --- | --- |
| 1 | Refined project plan | ✅ | `plan.md` (original kept in `plan_original.md`) |
| 2 | Knowledge base: 75 movies + semantic network | ✅ | `backend/data/movies.json`, `backend/knowledge_base.py` |
| 3 | Rule engine: forward chaining (20 rules) + constraint rules (2) | ✅ | `backend/rule_engine.py` |
| 4 | Heuristic scoring (0–100, partial credit) | ✅ | `backend/heuristic.py` |
| 5 | Pipeline: relaxation, best-first top 5, explanations, trace | ✅ | `backend/recommender.py` |
| 6 | Flask REST API (4 endpoints, validation, CORS) | ✅ | `backend/app.py` |
| 7 | Frontend: form, result cards, reasoning trace, knowledge base table | ✅ | `frontend/index.html`, `style.css`, `script.js` |
| 8 | Testing: 22 unit tests in a separate `tests/` folder + run script | ✅ | `tests/run_tests.py`, `tests/run_tests.bat`, `tests/test_*.py` |
| 9 | Documentation: setup, algorithm explanation, viva Q&A | ✅ | `README.md` |
| 10 | Code pushed to GitHub | ✅ | <https://github.com/YashParmar081005/ai-collage-project> |
| 11 | Dataset expanded to 10,000 real movies (32 languages) | ✅ | `backend/build_dataset.py`, `backend/data/movies.json`, `backend/data/curated_movies.json` |
| 12 | Push the 10,000-movie version to GitHub | ✅ | pushed as 7 separate commits |

---

## Log

### 2026-10-17 — Pushed to GitHub as separate commits

- Pushed the 10,000-movie version to <https://github.com/YashParmar081005/ai-collage-project> as 7 commits,
  one per change: dataset builder, 10,000-movie knowledge base, weighted-rating tie-break, API search,
  frontend updates, tests folder, docs.

### 2026-10-17 — Tests moved to a separate folder, frontend moved back

#### Tests

- Moved all tests out of `backend/` into a new top-level `tests/` folder, one file per module:
  `test_knowledge_base.py`, `test_rule_engine.py`, `test_heuristic.py`, `test_recommender.py`, `test_api.py`.
- `tests/helpers.py` holds the shared setup (adds `backend/` to the import path, loads the movies once, `prefs()` helper).
- `tests/run_tests.py` runs everything and prints a pass/fail summary; `python tests/run_tests.py rule_engine` runs one file.
- `tests/run_tests.bat`: double-click on Windows to run all tests.
- Added one test: every movie uses only known genres, moods and languages. **22 tests, all passing.**

#### Folder fix

- The `frontend` folder had been moved into `backend/frontend` (probably an accidental drag in VS Code; no script moved it).
  Moved it back to `ai project/frontend`, so Python code (`backend/`), web page (`frontend/`) and tests (`tests/`) are separate.
- `app.py` back to one simple path: `FRONTEND_DIR = <project>/frontend`.

### 2026-10-17 — Knowledge base expanded to 10,000 movies

#### Data

- New `backend/build_dataset.py` builds `movies.json` from the **IMDb datasets** (title, year, genres, runtime, rating, votes) and **Wikidata** (original language).
- Kept feature films with ≥ 2,500 votes, 40–300 min, no documentaries/adult titles (27,871 candidates), then chose 10,000: the most-voted films per language first (Hindi 900, Tamil/Telugu/Malayalam 450, others 200), then the most popular overall.
- Result: **10,000 movies in 32 languages**: English 4,593, Hindi 924, Tamil 392, Telugu 280, Malayalam 255, Kannada 61, Bengali 74, plus Japanese, Korean, French, Spanish and more.
- IMDb genres mapped to our 11 genres; moods derived from genres with IF-THEN rules (Comedy → funny, Horror → scary …).
- The 75 hand-tagged movies moved to `curated_movies.json`. They stay at the top of the list with their hand-picked moods and get fresh IMDb ratings/votes. All 75 matched, including Taare Zameen Par (IMDb: "Like Stars on Earth").
- Language picking for films that list several languages: rules + 6 hand fixes. Checked against about 30 well-known films (Avatar → English, Life Is Beautiful → Italian, Roma → Spanish, Rang De Basanti → Hindi …).
- New slots per movie: `votes`, `imdb_id`. `knowledge_base.LANGUAGES` now has 32 languages.

#### AI changes

- Ties between equal scores are now broken by **IMDb's weighted rating** (`heuristic.weighted_rating`), so a 9.4 rated by 3,000 people doesn't beat an 8.8 rated by 2 million.

#### API / UI

- `GET /api/movies` now takes `?search=` and `?limit=` (default 100) instead of sending all 10,000 rows.
- Knowledge base table: search box, Votes column, scrollable.
- Result cards show vote counts and an IMDb link. Numbers in the trace use thousands separators.
- "Too strict" example changed to max 60 min + rating ≥ 9.0, because the old one no longer triggers relaxation with 10,000 movies.
- `app.py` temporarily found the `frontend` folder inside `backend/` too (see the entry above: since moved back).

#### Verification

- `python -m unittest` → **21 tests, all passing** (tests no longer depend on exact rankings).
- Each recommendation takes 12–60 ms; loading 10,000 movies takes about 30 ms.
- Live server and browser screenshot checked: relaxation example, cards with votes and IMDb links, table search ("k.g.f" → both K.G.F films, Kannada).

### 2026-10-17 — Published to GitHub

- Initialised a git repo in the `ai project` folder (branch `main`) and added a `.gitignore` that excludes `__pycache__` and editor files.
- Pushed all code and docs to <https://github.com/YashParmar081005/ai-collage-project>.
- To push future changes: `git add .` → `git commit -m "message"` → `git push`.

### 2026-10-17 — Version 1.0 built end to end

#### Planning

- Read the original plan and kept it as `plan_original.md`.
- Wrote the refined `plan.md`: architecture, the 7-step AI pipeline, rule tables, scoring table, API spec, folder structure, milestones and testing plan.
- Decision: **plain HTML/CSS/JS instead of React**, as requested ("simple UI, not Next.js"). Flask serves the page, so one command (`python app.py`) runs everything. The only dependency is `flask`.

#### Backend (Python)

- `movies.json`: 75 movies in English, Hindi, Tamil, Telugu, Malayalam, Korean and Japanese, across 11 genres and 9 moods. Ratings are approximate IMDb values.
- `knowledge_base.py`: frames, a fixed vocabulary (ontology), a genre/mood semantic network, and a validation check run when the data loads.
- `rule_engine.py`: 20 forward-chaining inference rules (fill in "Any" genre/mood) and 2 hard constraint rules (C1 duration, C2 rating).
- `heuristic.py`: weighted score (Genre 30, Language 20, Mood 20, Duration 15, Rating 15) with half points for related genres/moods and sliding penalties for relaxed rules.
- `recommender.py`: full pipeline with constraint relaxation, `heapq` best-first selection, plain-English explanations and a reasoning trace.
- `app.py`: `GET /`, `GET /api/options`, `GET /api/movies`, `POST /api/recommend`. Bad input returns 400; CORS headers set.

#### Frontend

- Preference form (3 dropdowns, 3 sliders), 4 one-click example scenarios, a heuristic-weights panel.
- Result cards: rank, score ring, match label, summary, and a per-criterion breakdown bar with its reason.
- "How the AI decided" panel showing all 7 reasoning steps, and a knowledge base table.
- Responsive (checked at 390 px phone width with no sideways scroll) with automatic light/dark theme.

#### Fixes made during testing

- Ranking: weak movies that passed every rule (30/100) were ranked above strong movies admitted by relaxation (76.5/100). The score is now the first priority, and "fewest broken rules" is only a tie-breaker.
- The weights list showed in alphabetical order because Flask sorts JSON keys. Fixed with `app.json.sort_keys = False`.
- Ratings like 9.0 displayed as "9" in the browser. Now formatted to one decimal place.

#### Verification

- `python -m unittest -v` → **19 tests, all passing**.
- Live server checked over HTTP: page, CSS and JS load (200); `/api/movies` returns 75; strict filters trigger relaxation; bad input returns 400; CORS preflight OK.
- Headless-browser screenshots checked: desktop dark theme, desktop light theme, 390 px phone.

---

## Ideas for Later (only if needed)

- ⬜ Let the user adjust the weights from the page.
- ⬜ Add a "diversity" rule so the top 5 are not all from one genre.
- ⬜ Add more movies or another slot (for example, age certificate) with matching rules.
