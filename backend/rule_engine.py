"""
rule_engine.py  —  AI Concept 2: RULE-BASED REASONING

This module works like a tiny expert system. It has two kinds of IF-THEN rules.

1. INFERENCE RULES  (forward chaining)
   They work on the user's preferences (the "working memory" of facts).
   When the user leaves something as "Any", the engine infers a sensible value
   from the other preferences.
       IF genre = Any AND mood = funny  THEN genre = Comedy
   Forward chaining = keep firing rules whose IF-part is true until no rule
   can add a new fact.

2. CONSTRAINT RULES  (hard filters)
   They work on each movie and decide if it must be excluded.
       IF movie.duration > max_duration THEN exclude the movie
       IF movie.rating   < min_rating   THEN exclude the movie
"""

from knowledge_base import ANY

# ---------------------------------------------------------------------------
# 1. Inference rules:  "if" = facts that must all be true, "then" = new facts
# ---------------------------------------------------------------------------
INFERENCE_RULES = [
    # IF genre is Any AND mood is <m>  THEN infer the genre that best fits <m>
    {"id": "I1",  "if": {"genre": ANY, "mood": "action-packed"}, "then": {"genre": "Action"}},
    {"id": "I2",  "if": {"genre": ANY, "mood": "funny"},         "then": {"genre": "Comedy"}},
    {"id": "I3",  "if": {"genre": ANY, "mood": "emotional"},     "then": {"genre": "Drama"}},
    {"id": "I4",  "if": {"genre": ANY, "mood": "thrilling"},     "then": {"genre": "Thriller"}},
    {"id": "I5",  "if": {"genre": ANY, "mood": "romantic"},      "then": {"genre": "Romance"}},
    {"id": "I6",  "if": {"genre": ANY, "mood": "inspiring"},     "then": {"genre": "Drama"}},
    {"id": "I7",  "if": {"genre": ANY, "mood": "scary"},         "then": {"genre": "Horror"}},
    {"id": "I8",  "if": {"genre": ANY, "mood": "mind-bending"},  "then": {"genre": "Sci-Fi"}},
    {"id": "I9",  "if": {"genre": ANY, "mood": "feel-good"},     "then": {"genre": "Comedy"}},

    # IF mood is Any AND genre is <g>  THEN infer the mood that best fits <g>
    {"id": "I10", "if": {"mood": ANY, "genre": "Action"},    "then": {"mood": "action-packed"}},
    {"id": "I11", "if": {"mood": ANY, "genre": "Adventure"}, "then": {"mood": "thrilling"}},
    {"id": "I12", "if": {"mood": ANY, "genre": "Animation"}, "then": {"mood": "feel-good"}},
    {"id": "I13", "if": {"mood": ANY, "genre": "Comedy"},    "then": {"mood": "funny"}},
    {"id": "I14", "if": {"mood": ANY, "genre": "Crime"},     "then": {"mood": "thrilling"}},
    {"id": "I15", "if": {"mood": ANY, "genre": "Drama"},     "then": {"mood": "emotional"}},
    {"id": "I16", "if": {"mood": ANY, "genre": "Fantasy"},   "then": {"mood": "feel-good"}},
    {"id": "I17", "if": {"mood": ANY, "genre": "Horror"},    "then": {"mood": "scary"}},
    {"id": "I18", "if": {"mood": ANY, "genre": "Romance"},   "then": {"mood": "romantic"}},
    {"id": "I19", "if": {"mood": ANY, "genre": "Sci-Fi"},    "then": {"mood": "mind-bending"}},
    {"id": "I20", "if": {"mood": ANY, "genre": "Thriller"},  "then": {"mood": "thrilling"}},
]


def rule_to_text(rule):
    """Write a rule as a readable sentence, e.g. 'IF genre = Any AND mood = funny THEN genre = Comedy'."""
    conditions = " AND ".join(f"{key} = {value}" for key, value in rule["if"].items())
    conclusions = " AND ".join(f"{key} = {value}" for key, value in rule["then"].items())
    return f"IF {conditions} THEN {conclusions}"


def forward_chain(facts, rules=INFERENCE_RULES):
    """
    Forward chaining inference.

    Start with the user's facts. Repeatedly scan the rule list; when every
    condition of a rule is true, "fire" it: add its conclusion to the facts.
    Each rule fires at most once. Stop when a full scan fires no rule.

    Returns (new_facts, fired_rules).
    """
    facts = dict(facts)          # copy, so we never change the caller's data
    fired = []
    fired_ids = set()

    new_fact_added = True
    while new_fact_added:
        new_fact_added = False
        for rule in rules:
            if rule["id"] in fired_ids:
                continue
            conditions_true = all(facts.get(key) == value for key, value in rule["if"].items())
            if conditions_true:
                facts.update(rule["then"])
                fired.append(rule)
                fired_ids.add(rule["id"])
                new_fact_added = True

    return facts, fired


# ---------------------------------------------------------------------------
# 2. Constraint rules:  each one says when a movie must be EXCLUDED
# ---------------------------------------------------------------------------
def too_long(movie, prefs):
    return movie["duration"] > prefs["max_duration"]


def rated_too_low(movie, prefs):
    return movie["rating"] < prefs["min_rating"]


CONSTRAINT_RULES = [
    {"id": "C1", "name": "maximum duration",
     "text": "IF movie duration > your maximum duration THEN exclude the movie",
     "is_violated": too_long},
    {"id": "C2", "name": "minimum rating",
     "text": "IF movie rating < your minimum rating THEN exclude the movie",
     "is_violated": rated_too_low},
]

CONSTRAINT_BY_ID = {rule["id"]: rule for rule in CONSTRAINT_RULES}


def broken_constraints(movie, prefs):
    """Return the ids of every constraint rule this movie breaks (empty list = movie is allowed)."""
    return [rule["id"] for rule in CONSTRAINT_RULES if rule["is_violated"](movie, prefs)]
