"""
knowledge_base.py  —  AI Concept 1: KNOWLEDGE REPRESENTATION

The system's knowledge is stored in two forms:

1. FRAMES (movies.json, 10,000 movies built by build_dataset.py)
   Every movie is a frame: a structured record of slots (attributes) and values.
       title, year, language, genres, moods, duration, rating, votes, imdb_id

2. SEMANTIC NETWORK (GENRE_LINKS and MOOD_LINKS below)
   A small graph that links related concepts, for example Action <-> Thriller.
   This lets the system reason that a Thriller is a "near match" for someone
   who asked for Action, instead of treating it as a total miss.
"""

import json
from pathlib import Path

DATA_FILE = Path(__file__).parent / "data" / "movies.json"

ANY = "Any"   # the value used when the user has no preference

# ---------------------------------------------------------------------------
# Vocabulary (the "ontology"): every value a movie slot is allowed to have
# ---------------------------------------------------------------------------
GENRES = ["Action", "Adventure", "Animation", "Comedy", "Crime", "Drama",
          "Fantasy", "Horror", "Romance", "Sci-Fi", "Thriller"]

LANGUAGES = [
    "Arabic", "Armenian", "Azerbaijani", "Bengali", "Bulgarian", "Cantonese",
    "Catalan", "Czech", "Danish", "Dutch", "Dzongkha", "English", "Estonian",
    "Finnish", "French", "German", "Greek", "Haitian", "Hebrew", "Hindi",
    "Hungarian", "Icelandic", "Indonesian", "Irish", "Italian", "Japanese",
    "Kalaallisut", "Kannada", "Kazakh", "Khmer", "Kirghiz", "Korean",
    "Latvian", "Lithuanian", "Macedonian", "Malayalam", "Mandarin", "Maori",
    "Mongolian", "Norwegian", "Other", "Persian", "Polish", "Portuguese",
    "Romanian", "Russian", "Serbian", "Spanish", "Swedish", "Tagalog",
    "Tamil", "Telugu", "Thai", "Turkish", "Ukrainian", "Urdu", "Vietnamese", "Zulu"
]

MOODS = ["action-packed", "funny", "emotional", "thrilling", "romantic",
         "inspiring", "scary", "mind-bending", "feel-good"]

# ---------------------------------------------------------------------------
# Semantic network: each pair means "these two concepts are related".
# Links work in both directions.
# ---------------------------------------------------------------------------
GENRE_LINKS = [
    ("Action", "Adventure"), ("Action", "Thriller"), ("Action", "Sci-Fi"), ("Action", "Crime"),
    ("Adventure", "Fantasy"), ("Adventure", "Animation"), ("Adventure", "Sci-Fi"),
    ("Animation", "Comedy"), ("Animation", "Fantasy"),
    ("Comedy", "Romance"),
    ("Crime", "Thriller"), ("Crime", "Drama"),
    ("Drama", "Romance"),
    ("Fantasy", "Sci-Fi"),
    ("Horror", "Thriller"),
    ("Sci-Fi", "Thriller"),
]

MOOD_LINKS = [
    ("action-packed", "thrilling"),
    ("thrilling", "scary"), ("thrilling", "mind-bending"),
    ("funny", "feel-good"),
    ("feel-good", "inspiring"), ("feel-good", "romantic"),
    ("emotional", "romantic"), ("emotional", "inspiring"),
]


def build_network(links):
    """Turn a list of (a, b) pairs into an adjacency map: concept -> set of related concepts."""
    network = {}
    for a, b in links:
        network.setdefault(a, set()).add(b)
        network.setdefault(b, set()).add(a)
    return network


GENRE_NETWORK = build_network(GENRE_LINKS)
MOOD_NETWORK = build_network(MOOD_LINKS)


def related_genres(genre):
    """All genres directly linked to `genre` in the semantic network."""
    return GENRE_NETWORK.get(genre, set())


def related_moods(mood):
    """All moods directly linked to `mood` in the semantic network."""
    return MOOD_NETWORK.get(mood, set())


def validate_movie(movie):
    """Make sure a movie frame only uses known vocabulary. Raises ValueError if not."""
    title = movie.get("title", "?")
    for genre in movie["genres"]:
        if genre not in GENRES:
            raise ValueError(f"{title}: unknown genre '{genre}'")
    for mood in movie["moods"]:
        if mood not in MOODS:
            raise ValueError(f"{title}: unknown mood '{mood}'")
    if movie["language"] not in LANGUAGES:
        raise ValueError(f"{title}: unknown language '{movie['language']}'")
    if not 0 <= movie["rating"] <= 10:
        raise ValueError(f"{title}: rating must be between 0 and 10")
    if movie["duration"] <= 0:
        raise ValueError(f"{title}: duration must be positive")


def load_movies():
    """Read the knowledge base from movies.json and check every frame."""
    with open(DATA_FILE, encoding="utf-8") as file:
        movies = json.load(file)
    for movie in movies:
        validate_movie(movie)
    return movies
