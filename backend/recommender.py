"""
recommender.py  —  AI Concept 4: INTELLIGENT DECISION-MAKING

This module runs the whole AI pipeline for one request:

    1. Working memory     store the user's preferences as facts
    2. Forward chaining   infer missing preferences (rule_engine.py)
    3. Constraint rules   exclude movies that break a hard rule (rule_engine.py)
    4. Relaxation         if fewer than 5 movies survive, relax the least important rule
    5. Heuristic scoring  score every remaining movie out of 100 (heuristic.py)
    6. Best-first select  pop the 5 best movies from a priority queue
    7. Explanation        say in plain English why each movie was chosen
"""

import heapq

from heuristic import FULL, NONE, PARTIAL, score_movie, weighted_rating
from knowledge_base import ANY, GENRES, LANGUAGES, MOODS
from rule_engine import (CONSTRAINT_BY_ID, CONSTRAINT_RULES, broken_constraints,
                         forward_chain, rule_to_text)

TOP_K = 10

# When the user's filters are too strict, relax rules in this order.
# Duration goes first: a movie that is a bit too long is easier to accept
# than one the user thinks is badly rated.
RELAXATION_ORDER = ["C1", "C2"]

DEFAULT_PREFERENCES = {
    "genre": ANY,
    "language": ANY,
    "mood": ANY,
    "max_duration": 180,
    "min_rating": 0.0,
    "max_rating": 10.0,
}


# ---------------------------------------------------------------------------
# Input checking
# ---------------------------------------------------------------------------
def validate_preferences(data):
    """Check the request body and return a clean preferences dict. Raises ValueError on bad input."""
    if not isinstance(data, dict):
        raise ValueError("Send the preferences as a JSON object.")

    prefs = dict(DEFAULT_PREFERENCES)
    prefs.update({key: data[key] for key in DEFAULT_PREFERENCES if key in data})

    for key, allowed in (("genre", GENRES), ("language", LANGUAGES), ("mood", MOODS)):
        if prefs[key] != ANY and prefs[key] not in allowed:
            raise ValueError(f"Unknown {key} '{prefs[key]}'. Choose one of: {ANY}, {', '.join(allowed)}.")

    try:
        prefs["max_duration"] = int(prefs["max_duration"])
        prefs["min_rating"] = float(prefs["min_rating"])
        prefs["max_rating"] = float(prefs["max_rating"])
    except (TypeError, ValueError):
        raise ValueError("max_duration, min_rating and max_rating must be numbers.") from None

    if not 30 <= prefs["max_duration"] <= 300:
        raise ValueError("max_duration must be between 30 and 300 minutes.")
    if not 0 <= prefs["min_rating"] <= prefs["max_rating"] <= 10:
        raise ValueError("Ratings must satisfy 0 <= min_rating <= max_rating <= 10.")

    return prefs


# ---------------------------------------------------------------------------
# Steps 3-4: constraint rules and relaxation
# ---------------------------------------------------------------------------
def allowed_movies(movies, broken, active_rules):
    """Movies that break none of the currently active constraint rules."""
    return [movie for movie in movies
            if not any(rule_id in active_rules for rule_id in broken[movie["id"]])]


# ---------------------------------------------------------------------------
# Step 6: best-first selection with a priority queue
# ---------------------------------------------------------------------------
def best_first_select(scored, k, average_rating):
    """
    Push every scored movie into a min-heap (priority queue) and pop the best k.

    Priority, best first:
      1. highest heuristic score
      2. fewest broken (relaxed) rules  -> on equal scores, rule-abiding movies win
      3. highest weighted rating         -> IMDb formula: a well-trusted rating wins ties
      4. title A-Z, then id              -> makes the order fully predictable
    Python's heapq pops the smallest value, so "higher is better" values are negated.
    """
    frontier = []
    for item in scored:
        movie = item["movie"]
        trust = weighted_rating(movie, average_rating)
        priority = (-item["score"], len(item["broken_rules"]), -trust, movie["title"], movie["id"])
        heapq.heappush(frontier, (priority, item))

    selected = []
    while frontier and len(selected) < k:
        _, best = heapq.heappop(frontier)
        selected.append(best)
    return selected


# ---------------------------------------------------------------------------
# Step 7: explanation
# ---------------------------------------------------------------------------
CRITERION_LABELS = {
    "genre": "genre",
    "language": "language",
    "mood": "mood",
    "duration": "time limit",
    "rating": "rating range",
}


def match_label(score):
    if score >= 85:
        return "Excellent match"
    if score >= 65:
        return "Good match"
    if score >= 45:
        return "Fair match"
    return "Weak match"


def join_words(words):
    """['a', 'b', 'c'] -> 'a, b and c'"""
    if len(words) == 1:
        return words[0]
    return ", ".join(words[:-1]) + " and " + words[-1]


def explain(item):
    """Build a one-line summary and a list of reasons from the score breakdown."""
    breakdown = item["breakdown"]

    def labels_with(status):
        return [CRITERION_LABELS[c["criterion"]] for c in breakdown if c["status"] == status]

    full, partial, missed = labels_with(FULL), labels_with(PARTIAL), labels_with(NONE)

    sentences = []
    if full:
        sentences.append(f"It matches your {join_words(full)}.")
    if partial:
        sentences.append(f"It partly matches your {join_words(partial)}.")
    if missed:
        sentences.append(f"It does not match your {join_words(missed)}.")
    if item["broken_rules"]:
        names = join_words([CONSTRAINT_BY_ID[rule_id]["name"] for rule_id in item["broken_rules"]])
        sentences.append(f"Shown only because your filters were strict: it breaks the relaxed {names} rule.")

    reasons = [c["reason"] for c in breakdown if c["status"] in (FULL, PARTIAL)]
    return " ".join(sentences), reasons


def build_recommendation(rank, item):
    movie = item["movie"]
    summary, reasons = explain(item)
    return {
        "rank": rank,
        **movie,
        "score": item["score"],
        "match_label": match_label(item["score"]),
        "summary": summary,
        "reasons": reasons,
        "breakdown": item["breakdown"],
        "relaxed_rules": [{"id": rule_id, "name": CONSTRAINT_BY_ID[rule_id]["name"]}
                          for rule_id in item["broken_rules"]],
    }


# ---------------------------------------------------------------------------
# The full pipeline
# ---------------------------------------------------------------------------
def recommend(prefs, movies, top_k=TOP_K):
    """Run steps 1-7 and return the top-k recommendations plus a reasoning trace."""

    # Steps 1-2: working memory + forward chaining
    facts, fired_rules = forward_chain(prefs)
    inferred = {key for rule in fired_rules for key in rule["then"]}

    # Step 3: apply every constraint rule to every movie
    broken = {movie["id"]: broken_constraints(movie, facts) for movie in movies}
    active_rules = [rule["id"] for rule in CONSTRAINT_RULES]
    candidates = allowed_movies(movies, broken, active_rules)
    passed_all_rules = len(candidates)

    # Step 4: constraint relaxation
    relaxed_rules = []
    for rule_id in RELAXATION_ORDER:
        if len(candidates) >= top_k:
            break
        active_rules.remove(rule_id)
        relaxed_rules.append(rule_id)
        candidates = allowed_movies(movies, broken, active_rules)

    # Step 5: heuristic scoring of each candidate
    scored = []
    for movie in candidates:
        score, breakdown = score_movie(movie, facts, inferred)
        scored.append({"movie": movie, "score": score, "breakdown": breakdown,
                       "broken_rules": broken[movie["id"]]})

    # Step 6: best-first selection
    average_rating = sum(movie["rating"] for movie in movies) / len(movies)
    top = best_first_select(scored, top_k, average_rating)

    # Step 7: explanations
    recommendations = [build_recommendation(rank, item) for rank, item in enumerate(top, start=1)]

    relaxation_message = None
    if relaxed_rules:
        names = join_words([f"{CONSTRAINT_BY_ID[r]['name']} ({r})" for r in relaxed_rules])
        passed = f"Only {passed_all_rules} movie(s)" if passed_all_rules else "No movie"
        relaxation_message = (f"{passed} passed every rule, so the system relaxed "
                              f"the {names} rule. Movies that break a relaxed rule lose points "
                              f"and are marked on their card.")

    trace = {
        "total_movies": len(movies),
        "preferences": prefs,
        "inferred_preferences": facts,
        "inference": [{"id": rule["id"], "text": rule_to_text(rule)} for rule in fired_rules],
        "constraints": [{"id": rule["id"], "name": rule["name"], "text": rule["text"],
                         "excluded": sum(1 for movie in movies if rule["id"] in broken[movie["id"]]),
                         "relaxed": rule["id"] in relaxed_rules}
                        for rule in CONSTRAINT_RULES],
        "passed_all_rules": passed_all_rules,
        "relaxation_message": relaxation_message,
        "candidates": len(candidates),
        "selected": len(recommendations),
    }
    return {"recommendations": recommendations, "trace": trace}
