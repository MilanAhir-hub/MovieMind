"""
helpers.py  —  shared setup used by every test file

1. Adds the backend folder to Python's import path, so tests can write
   `from rule_engine import forward_chain` even though they live in tests/.
2. Loads the knowledge base once and offers small helpers used by several tests.

Every test file imports this module FIRST, before any backend module.
"""

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from knowledge_base import load_movies          # noqa: E402  (must come after the path change)
from recommender import validate_preferences    # noqa: E402

MOVIES = load_movies()

# the 75 hand-tagged movies come first in movies.json, so the first match is the curated one
BY_TITLE = {}
for movie in MOVIES:
    BY_TITLE.setdefault((movie["title"], movie["language"]), movie)


def prefs(**changes):
    """Valid preferences with no restrictions, plus any changes."""
    return validate_preferences(changes)
