# Project Plan — AI Movie Recommendation System (Traditional AI, No ML)

> Final, refined plan. The original request is kept in `plan_original.md`.
> Progress is tracked in `workdone.md`.

---

## 1. Objective

Build a working movie recommendation system that suggests the **top 5 movies** for a user
using only **classical AI techniques**:

| AI concept | Where it lives in the project |
| --- | --- |
| Knowledge Representation | `backend/data/movies.json` + genre / mood **semantic network** in `knowledge_base.py` |
| Rule-Based Reasoning | **Forward-chaining** inference rules + **IF-THEN constraint rules** in `rule_engine.py` |
| Heuristic Evaluation | Weighted **scoring function (0–100)** with partial credit in `heuristic.py` |
| Intelligent Decision-Making | **Best-first selection** with a priority queue + **constraint relaxation** in `recommender.py` |
| Explanation Facility | Every score comes with a plain-English "why" + a full reasoning trace |

**Not used:** machine learning, neural networks, training data, embeddings, or any AI API.
Every decision is made by our own Python code, step by step.

---

## 2. Technology Decisions

| Layer | Choice | Reason |
| --- | --- | --- |
| Frontend | **Plain HTML + CSS + JavaScript** (no React or Next.js) | Simple, no build step, no `npm install`. You asked for a simple UI. |
| Backend | **Python 3 + Flask** | Lightweight REST API. |
| Dataset | **JSON file** (75 movies, 7 languages) | Human-readable knowledge base. |
| Communication | **REST API (JSON)** | `fetch()` from browser → Flask. |
| Hosting | Flask serves the UI too | One command runs everything: `python app.py`. |
| Tests | Python `unittest` (built in) | No extra installs. |

Only dependency: `flask`.

---

## 3. Architecture

```text
 ┌───────────────────────────┐        POST /api/recommend        ┌──────────────────────────────┐
 │  Browser (index.html)     │  ───────────────────────────────▶ │  Flask app (app.py)          │
 │  - preference form        │        JSON preferences           │                              │
 │  - result cards           │                                   │  recommender.py (pipeline)   │
 │  - "How the AI decided"   │  ◀─────────────────────────────── │   ├─ rule_engine.py          │
 │  - knowledge base table   │   top-5 + scores + explanations   │   ├─ heuristic.py            │
 └───────────────────────────┘          + reasoning trace        │   └─ knowledge_base.py       │
                                                                 │        └─ data/movies.json   │
                                                                 └──────────────────────────────┘
```

---

## 4. The AI Pipeline (what happens on every request)

```text
User preferences
      │
      ▼
① Working memory        facts = {genre, language, mood, max_duration, min_rating, max_rating}
      │
      ▼
② Forward chaining      fire inference rules until no new fact appears
                        e.g. IF genre = Any AND mood = funny THEN genre = Comedy
      │
      ▼
③ Constraint rules      IF duration > max_duration THEN exclude
   (hard IF-THEN)       IF rating   < min_rating   THEN exclude
      │
      ▼
④ Constraint relaxation if fewer than 5 movies survive, relax the least important rule
                        (duration first, then rating) and tell the user
      │
      ▼
⑤ Heuristic scoring     score each candidate out of 100 using weighted scoring rules
                        (exact match = full points, related match = half points)
      │
      ▼
⑥ Best-first selection  push all candidates into a priority queue, pop the best 5
                        priority = (score, fewest broken rules, rating)
      │
      ▼
⑦ Explanation           turn each scoring rule that fired into a plain-English reason
```

### 4.1 Knowledge Representation

Each movie is a **frame** (a structured record of attribute → value slots):

```json
{ "id": 1, "title": "Inception", "year": 2010,
  "genres": ["Sci-Fi", "Action", "Thriller"], "language": "English",
  "moods": ["mind-bending", "thrilling"], "duration": 148, "rating": 8.8 }
```

A small **semantic network** links related concepts, so the system can reason that
"Thriller is close to Action" or "feel-good is close to funny":

- Genres: Action–Adventure, Action–Thriller, Crime–Thriller, Horror–Thriller, Romance–Drama, …
- Moods: action-packed–thrilling, funny–feel-good, emotional–romantic, …

### 4.2 Rule-Based Reasoning

**(a) Inference rules — forward chaining.** They fill in the gaps when the user picks "Any".

| Rule | IF | THEN |
| --- | --- | --- |
| I1–I9 | genre = Any AND mood = *m* | genre = genre most typical of *m* (funny → Comedy, scary → Horror, …) |
| I10–I20 | mood = Any AND genre = *g* | mood = mood most typical of *g* (Comedy → funny, Horror → scary, …) |

**(b) Constraint rules — hard IF-THEN filters.**

| Rule | IF | THEN |
| --- | --- | --- |
| C1 | movie.duration > max_duration | exclude the movie |
| C2 | movie.rating < min_rating | exclude the movie |

### 4.3 Heuristic Evaluation (score out of 100)

Each criterion is itself a small IF-THEN scoring rule:

| Criterion | Weight | Full points | Partial points | Zero |
| --- | --- | --- | --- | --- |
| Genre | 30 | preferred genre is one of the movie's genres | a movie genre is *related* (semantic network) → 15 | otherwise |
| Language | 20 | same language (or user chose Any) | — | otherwise |
| Mood | 20 | preferred mood is one of the movie's moods | related mood → 10 | otherwise |
| Duration | 15 | within the maximum duration | over the limit (only after relaxation): loses points per extra minute | 60+ min over |
| Rating | 15 | inside the preferred rating range | outside the range: loses points per 0.1 away | 2+ points away |

Weights live in one dictionary (`WEIGHTS` in `heuristic.py`), so they are easy to change.

### 4.4 Intelligent Decision-Making

- **Best-first selection:** all scored movies go into a priority queue (`heapq`).
  The movie with the best priority is popped first. We pop 5 times.
- **Priority** = (higher score, fewer broken rules, higher rating, title A–Z).
  On equal scores, a movie that obeys every rule beats one admitted by relaxation.
- **Constraint relaxation:** if the user's filters are too strict (fewer than 5 movies),
  the system does not return an empty page. It relaxes one rule at a time and says
  which rule it relaxed.

---

## 5. Features (and only these — kept simple on purpose)

1. Preference form: genre, language, mood, max duration (slider), rating range (min/max sliders).
2. Top-5 result cards: title, year, genres, language, duration, rating, **match score**,
   per-criterion **score breakdown bars**, and a **"Why recommended"** list.
3. **"How the AI decided"** panel: step-by-step reasoning trace (rules fired, movies excluded,
   relaxation, ranking).
4. **Knowledge base** viewer: the full movie table, so the professor can see the data.
5. Responsive layout (works on phone and laptop), light/dark mode follows the system theme.

**Out of scope:** login, database, payments, posters from the internet, ML, AI APIs.

---

## 6. REST API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/` | Serves the web UI |
| GET | `/api/options` | Lists genres, languages, moods, scoring weights (to build the form) |
| GET | `/api/movies` | Returns the full knowledge base |
| POST | `/api/recommend` | Takes preferences, returns top-5 + reasoning trace |

Request body for `/api/recommend`:

```json
{ "genre": "Action", "language": "Hindi", "mood": "action-packed",
  "max_duration": 160, "min_rating": 7.0, "max_rating": 10 }
```

Invalid input (unknown genre, min_rating > max_rating, …) → `400` with an error message.

---

## 7. Folder Structure

```text
ai project/
├── plan.md                 ← this file
├── plan_original.md        ← your original request
├── workdone.md             ← progress log (keep updating it)
├── README.md               ← setup + how the AI works (for presentation)
├── backend/
│   ├── app.py              ← Flask app + REST API + serves frontend
│   ├── knowledge_base.py   ← loads movies, semantic network
│   ├── rule_engine.py      ← forward chaining + constraint rules
│   ├── heuristic.py        ← weighted scoring function
│   ├── recommender.py      ← full pipeline, relaxation, best-first selection, explanations
│   ├── test_recommender.py ← unit tests
│   ├── requirements.txt
│   └── data/
│       └── movies.json     ← knowledge base (75 movies)
└── frontend/
    ├── index.html
    ├── style.css
    └── script.js
```

---

## 8. Build Milestones

| # | Milestone | Done when |
| --- | --- | --- |
| 1 | Plan | this file written |
| 2 | Knowledge base | `movies.json` with 75 movies + semantic network |
| 3 | Rule engine | forward chaining + constraint rules return a trace |
| 4 | Heuristic | score 0–100 with breakdown and reasons |
| 5 | Recommender pipeline | relaxation + best-first top-5 + explanations |
| 6 | Flask API | 4 endpoints, input validation, CORS |
| 7 | Frontend | form, cards, trace panel, KB table, responsive |
| 8 | Testing | unit tests pass + manual API checks + UI check |
| 9 | Docs | README with setup + algorithm explanation |

---

## 9. Testing Plan

- Unit tests: weights sum to 100; forward chaining infers genre from mood; constraint rules
  exclude long and low-rated movies; relaxation fills up to 5; ranking order is correct;
  API returns 400 on bad input.
- Manual: run the server, try strict and loose preferences, and check the explanations make sense.

---

## 10. How to Present It (2-minute pitch)

1. "Our knowledge base stores movies as frames, plus a semantic network of related genres and moods."
2. "First, a forward-chaining engine completes the user's preferences. Then hard IF-THEN rules filter out movies."
3. "Next, a heuristic function scores every remaining movie out of 100, with partial credit for related genres."
4. "Finally, best-first selection with a priority queue picks the top 5. If the filters are too strict, the system relaxes a rule and tells you."
5. "Every recommendation explains itself. There's no black box, because there's no ML."
