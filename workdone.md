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
| 8 | Testing: 19 unit tests + live API + browser screenshots | ✅ | `backend/test_recommender.py` |
| 9 | Documentation: setup, algorithm explanation, viva Q&A | ✅ | `README.md` |

---

## Log

### 2026-10-17 — Version 1.0 built end to end

**Planning**
- Read the original plan and kept it as `plan_original.md`.
- Wrote the refined `plan.md`: architecture, the 7-step AI pipeline, rule tables, scoring table, API spec, folder structure, milestones and testing plan.
- Decision: **plain HTML/CSS/JS instead of React**, as requested ("simple UI, not Next.js"). Flask serves the page, so one command (`python app.py`) runs everything. The only dependency is `flask`.

**Backend (Python)**
- `movies.json`: 75 movies in English, Hindi, Tamil, Telugu, Malayalam, Korean and Japanese, across 11 genres and 9 moods. Ratings are approximate IMDb values.
- `knowledge_base.py`: frames, a fixed vocabulary (ontology), a genre/mood semantic network, and a validation check run when the data loads.
- `rule_engine.py`: 20 forward-chaining inference rules (fill in "Any" genre/mood) and 2 hard constraint rules (C1 duration, C2 rating).
- `heuristic.py`: weighted score (Genre 30, Language 20, Mood 20, Duration 15, Rating 15) with half points for related genres/moods and sliding penalties for relaxed rules.
- `recommender.py`: full pipeline with constraint relaxation, `heapq` best-first selection, plain-English explanations and a reasoning trace.
- `app.py`: `GET /`, `GET /api/options`, `GET /api/movies`, `POST /api/recommend`. Bad input returns 400; CORS headers set.

**Frontend**
- Preference form (3 dropdowns, 3 sliders), 4 one-click example scenarios, a heuristic-weights panel.
- Result cards: rank, score ring, match label, summary, and a per-criterion breakdown bar with its reason.
- "How the AI decided" panel showing all 7 reasoning steps, and a knowledge base table.
- Responsive (checked at 390 px phone width with no sideways scroll) with automatic light/dark theme.

**Fixes made during testing**
- Ranking: weak movies that passed every rule (30/100) were ranked above strong movies admitted by relaxation (76.5/100). The score is now the first priority, and "fewest broken rules" is only a tie-breaker.
- The weights list showed in alphabetical order because Flask sorts JSON keys. Fixed with `app.json.sort_keys = False`.
- Ratings like 9.0 displayed as "9" in the browser. Now formatted to one decimal place.

**Verification**
- `python -m unittest -v` → **19 tests, all passing**.
- Live server checked over HTTP: page, CSS and JS load (200); `/api/movies` returns 75; strict filters trigger relaxation; bad input returns 400; CORS preflight OK.
- Headless-browser screenshots checked: desktop dark theme, desktop light theme, 390 px phone.

---

## Ideas for Later (only if needed)

- ⬜ Let the user adjust the weights from the page.
- ⬜ Add a "diversity" rule so the top 5 are not all from one genre.
- ⬜ Add more movies or another slot (for example, age certificate) with matching rules.
