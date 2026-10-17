"""
heuristic.py  —  AI Concept 3: HEURISTIC EVALUATION

A heuristic function estimates "how good is this option?" without trying every
possibility in depth. Here it scores how well ONE movie matches the user's
preferences, on a scale of 0 to 100.

The score is the sum of five small scoring rules, one per criterion:

    Criterion   Weight   Full points when...                Partial points when...
    ---------   ------   --------------------------------   -----------------------------------
    Genre         30     movie has the preferred genre      it has a RELATED genre   (half)
    Language      20     movie is in the preferred language          -
    Mood          20     movie has the preferred mood       it has a RELATED mood    (half)
    Duration      15     movie fits the time limit          a little over the limit (sliding)
    Rating        15     rating is inside the range         a little outside the range (sliding)

"Related" comes from the semantic network in knowledge_base.py.
Change WEIGHTS to make a criterion more or less important (keep the total at 100).
"""

from knowledge_base import ANY, related_genres, related_moods

WEIGHTS = {
    "genre": 30,
    "language": 20,
    "mood": 20,
    "duration": 15,
    "rating": 15,
}

PARTIAL_CREDIT = 0.5     # a related genre / mood earns half the points
DURATION_GRACE = 60      # minutes over the limit at which duration points reach zero
RATING_GRACE = 2.0       # rating points outside the range at which rating points reach zero

# status values used in the breakdown (the UI colours bars with them)
FULL, PARTIAL, NONE, NO_PREFERENCE = "full", "partial", "none", "any"


def criterion(name, points, status, reason):
    """Package the result of one scoring rule."""
    return {
        "criterion": name,
        "points": round(points, 1),
        "max": WEIGHTS[name],
        "status": status,
        "reason": reason,
    }


def score_genre(movie, prefs, inferred):
    wanted = prefs["genre"]
    weight = WEIGHTS["genre"]
    note = " (inferred from your mood)" if "genre" in inferred else ""

    if wanted == ANY:
        return criterion("genre", weight, NO_PREFERENCE, "No genre preference, so every genre gets full points")
    if wanted in movie["genres"]:
        return criterion("genre", weight, FULL, f"It is a {wanted} movie, your preferred genre{note}")

    related = [genre for genre in movie["genres"] if genre in related_genres(wanted)]
    if related:
        return criterion("genre", weight * PARTIAL_CREDIT, PARTIAL,
                         f"Its genre {related[0]} is closely related to {wanted}{note}")
    return criterion("genre", 0, NONE, f"It is not a {wanted} movie ({', '.join(movie['genres'])})")


def score_language(movie, prefs):
    wanted = prefs["language"]
    weight = WEIGHTS["language"]

    if wanted == ANY:
        return criterion("language", weight, NO_PREFERENCE, "No language preference, so every language gets full points")
    if movie["language"] == wanted:
        return criterion("language", weight, FULL, f"It is in {wanted}, your preferred language")
    return criterion("language", 0, NONE, f"It is in {movie['language']}, not {wanted}")


def score_mood(movie, prefs, inferred):
    wanted = prefs["mood"]
    weight = WEIGHTS["mood"]
    note = " (inferred from your genre)" if "mood" in inferred else ""

    if wanted == ANY:
        return criterion("mood", weight, NO_PREFERENCE, "No mood preference, so every mood gets full points")
    if wanted in movie["moods"]:
        return criterion("mood", weight, FULL, f"Its mood is {wanted}, just what you wanted{note}")

    related = [mood for mood in movie["moods"] if mood in related_moods(wanted)]
    if related:
        return criterion("mood", weight * PARTIAL_CREDIT, PARTIAL,
                         f"Its mood is {related[0]}, which is close to {wanted}{note}")
    return criterion("mood", 0, NONE, f"Its mood ({', '.join(movie['moods'])}) is not {wanted}")


def score_duration(movie, prefs):
    limit = prefs["max_duration"]
    length = movie["duration"]
    weight = WEIGHTS["duration"]

    if length <= limit:
        return criterion("duration", weight, FULL, f"At {length} min it fits your {limit}-min limit")

    # only reached when the duration rule was relaxed: lose points for every extra minute
    over = length - limit
    points = weight * max(0.0, 1 - over / DURATION_GRACE)
    status = PARTIAL if points > 0 else NONE
    return criterion("duration", points, status, f"It is {over} min longer than your {limit}-min limit")


def score_rating(movie, prefs):
    low, high = prefs["min_rating"], prefs["max_rating"]
    rating = movie["rating"]
    weight = WEIGHTS["rating"]

    if low <= rating <= high:
        return criterion("rating", weight, FULL, f"Rated {rating}/10, inside your {low:.1f}-{high:.1f} range")

    # outside the range: lose points the further away the rating is
    distance = (low - rating) if rating < low else (rating - high)
    points = weight * max(0.0, 1 - distance / RATING_GRACE)
    status = PARTIAL if points > 0 else NONE
    return criterion("rating", points, status, f"Rated {rating}/10, outside your {low:.1f}-{high:.1f} range")


def score_movie(movie, prefs, inferred=()):
    """
    The heuristic evaluation function h(movie) -> 0..100.
    `inferred` lists the preference keys that came from forward chaining
    (used only to word the explanation).
    """
    breakdown = [
        score_genre(movie, prefs, inferred),
        score_language(movie, prefs),
        score_mood(movie, prefs, inferred),
        score_duration(movie, prefs),
        score_rating(movie, prefs),
    ]
    total = round(sum(item["points"] for item in breakdown), 1)
    return total, breakdown
