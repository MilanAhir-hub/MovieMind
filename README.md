# MovieMind: AI Movie Recommendation System (Traditional AI, No ML)

MovieMind recommends the **top 5 movies** for your preferences using **classical AI only**:
knowledge representation, rule-based reasoning (forward chaining), heuristic evaluation
and best-first selection. It does not use machine learning, neural networks or any AI API.

- Backend: Python + Flask (REST API)
- Frontend: plain HTML + CSS + JavaScript (no React, no build step)
- Knowledge base: `backend/data/movies.json` (75 movies, 7 languages)

---

## 1. Setup and Run

You need **Python 3.9+**. Flask is the only package.

```powershell
cd "D:\ai clg practical\ai project\backend"
pip install -r requirements.txt
python app.py
```

Then open **<http://127.0.0.1:5000>** in your browser. Flask serves both the API and the web page.
Press `Ctrl + C` in the terminal to stop the server.

Run the tests (from the `backend` folder):

```powershell
python -m unittest -v
```

---

## 2. Project Structure

```text
ai project/
├── README.md               ← this file
├── plan.md                 ← detailed project plan
├── workdone.md             ← progress log
├── backend/
│   ├── app.py              ← Flask app: REST API + serves the frontend
│   ├── knowledge_base.py   ← AI concept 1: frames + semantic network
│   ├── rule_engine.py      ← AI concept 2: forward chaining + IF-THEN constraint rules
│   ├── heuristic.py        ← AI concept 3: heuristic scoring function (0–100)
│   ├── recommender.py      ← AI concept 4: pipeline, relaxation, best-first selection, explanations
│   ├── test_recommender.py ← 19 unit tests
│   ├── requirements.txt
│   └── data/movies.json    ← the knowledge base
└── frontend/
    ├── index.html          ← page layout
    ├── style.css           ← styling (responsive, light/dark)
    └── script.js           ← calls the API and draws the results
```

---

## 3. How the AI Works

Every click on **Recommend movies** runs this pipeline in `recommender.py`:

```text
preferences → ① working memory → ② forward chaining → ③ constraint rules
            → ④ relaxation (if needed) → ⑤ heuristic scoring → ⑥ best-first top 5 → ⑦ explanation
```

### Concept 1: Knowledge Representation (`knowledge_base.py`)

- **Frames:** each movie is a structured record with slots:
  `title, year, language, genres, moods, duration, rating`.
- **Semantic network:** a small graph of related concepts, for example
  `Action — Thriller`, `Crime — Thriller`, `funny — feel-good`, `emotional — romantic`.
  This lets the system recognise a *near match* instead of treating it as a total miss.
- **Ontology:** fixed lists of allowed genres, languages and moods. Every movie is checked against them when it loads.

### Concept 2: Rule-Based Reasoning (`rule_engine.py`)

**(a) Forward chaining (inference rules).** The user's preferences are stored as *facts*.
The engine fires every rule whose IF-part is true, adds the THEN-part as a new fact, and
repeats until no rule can add anything new. This fills in gaps when the user picks "Any":

```text
I2 : IF genre = Any AND mood = funny  THEN genre = Comedy
I17: IF mood = Any AND genre = Horror THEN mood = scary
```

There are 20 inference rules (I1–I20).

**(b) Constraint rules (hard IF-THEN filters).**

```text
C1: IF movie duration > your maximum duration THEN exclude the movie
C2: IF movie rating   < your minimum rating   THEN exclude the movie
```

### Concept 3: Heuristic Evaluation (`heuristic.py`)

A heuristic function `h(movie)` estimates how good a movie is for this user, from 0 to 100:

| Criterion | Weight | Full points | Partial points |
| --- | --- | --- | --- |
| Genre | 30 | movie has the preferred genre | related genre in the semantic network → 15 |
| Language | 20 | same language | — |
| Mood | 20 | movie has the preferred mood | related mood → 10 |
| Duration | 15 | fits the time limit | over the limit (after relaxation) → loses 0.25 pt per extra minute |
| Rating | 15 | inside the rating range | outside the range → loses 0.75 pt per 0.1 away |

"Any" earns full points for that criterion. The weights are in the `WEIGHTS` dictionary and are easy to change.

### Concept 4: Intelligent Decision-Making (`recommender.py`)

- **Best-first selection:** every scored movie is pushed into a **priority queue** (`heapq`).
  The queue always pops the most promising movie first; we pop 5 times.
  Priority = higher score → fewer broken rules → higher rating → title A–Z.
- **Constraint relaxation:** if fewer than 5 movies pass the hard rules, the system does not
  return an empty page. It relaxes the duration rule first, then the rating rule, and tells the
  user which rule it relaxed. Movies that break a relaxed rule lose points and are marked.
- **Explanation facility:** every scoring rule produces a reason ("It is a Comedy movie,
  your preferred genre (inferred from your mood)"), and the page shows the whole reasoning trace
  under **How the AI decided**.

### Worked example 1: inference in action

Preferences: genre **Any**, language **English**, mood **funny**, max **120 min**, rating **7.0–10**.

1. Forward chaining fires **I2** → `genre = Comedy` (inferred).
2. C1 flags 55 movies longer than 120 min; C2 flags 6 rated below 7.0 (some break both) → **18 of 75 movies pass**.
3. Each of the 18 is scored. Toy Story: Comedy ✔ 30 + English ✔ 20 + funny ✔ 20 + 81 min ✔ 15 + 8.3 ✔ 15 = **100**.
4. Several movies score 100, so the priority queue breaks ties by rating:
   Toy Story (8.3), Inside Out (8.1), Paddington 2 (7.8), The Hangover (7.7), Superbad (7.6).

### Worked example 2: relaxation and partial credit

Preferences: genre **Horror**, language **Korean**, mood **Any**, max **90 min**, rating **8.0–10**.

1. Forward chaining fires **I17** → `mood = scary`.
2. Only **3** movies are ≤ 90 min and rated ≥ 8.0, so the system **relaxes C1** (duration).
3. Tumbbad (Hindi, Horror, scary, 104 min, 8.2):
   genre 30 + language 0 + mood 20 + duration 15 × (1 − 14/60) = 11.5 + rating 15 = **76.5**.
4. Oldboy (Korean, Thriller): genre is *related* to Horror → 15, mood *thrilling* is related to scary → 10,
   so it scores **67.5**.

---

## 4. REST API

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/` | The web page |
| GET | `/api/options` | Genres, languages, moods, weights, defaults |
| GET | `/api/movies` | Full knowledge base |
| POST | `/api/recommend` | Preferences in → top 5 + reasoning trace out |

Example request:

```json
POST /api/recommend
{ "genre": "Action", "language": "Hindi", "mood": "action-packed",
  "max_duration": 160, "min_rating": 7.0, "max_rating": 10 }
```

Each recommendation contains `title, year, language, genres, moods, duration, rating, score,
match_label, summary, reasons, breakdown, relaxed_rules`. The `trace` object holds the fired
inference rules, how many movies each constraint excluded, and the relaxation message.
Bad input (unknown genre, `min_rating > max_rating`, …) returns **HTTP 400** with an `error` message.

---

## 5. Customising

- **Add a movie:** add an object to `backend/data/movies.json` (use only genres, moods and languages listed in `knowledge_base.py`). Restart the server.
- **Change importance:** edit `WEIGHTS` in `heuristic.py` (keep the total at 100).
- **Add a rule:** add a line to `INFERENCE_RULES` or a function + entry to `CONSTRAINT_RULES` in `rule_engine.py`.
- **Relate two genres/moods:** add a pair to `GENRE_LINKS` / `MOOD_LINKS` in `knowledge_base.py`.

---

## 6. Viva Questions (quick answers)

**Why is this AI but not ML?**
All knowledge (rules, weights, relations) is written by us. Nothing is learned from data, and
every decision can be traced back to a specific rule. This is the classical "symbolic AI" or expert-system approach.

**What is forward chaining?**
Data-driven reasoning: start from known facts, fire every rule whose conditions are met, add the
conclusions as new facts, and repeat until nothing changes. Backward chaining (as in Prolog) is the
opposite: it starts from a goal and works back to the facts.

**What is the heuristic here?**
An evaluation function that estimates how well a movie fits the user, using weighted partial matches.
It is the same idea as `f(n)` in best-first search: a quick estimate used to decide what to pick first.

**Why a priority queue?**
It always gives the current best candidate in O(log n), which is exactly how best-first search
chooses the next node to expand.

**What happens if nothing matches?**
Constraint relaxation: the least important hard rule becomes soft, the user is told, and the
movies that break it are penalised and marked.

**Limitations?**
The rules and weights are hand-made, the dataset is small, and the system does not learn from user history.
These are exactly the trade-offs of rule-based AI compared with ML.
