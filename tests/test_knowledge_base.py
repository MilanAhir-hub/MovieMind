"""Tests for knowledge_base.py  —  AI concept 1: knowledge representation."""

import unittest

from helpers import MOVIES   # first: sets up the import path
from knowledge_base import GENRES, LANGUAGES, MOODS, related_genres, related_moods


class KnowledgeBaseTests(unittest.TestCase):
    def test_movies_load_and_ids_are_unique(self):
        self.assertGreaterEqual(len(MOVIES), 50)
        self.assertEqual(len({m["id"] for m in MOVIES}), len(MOVIES))

    def test_every_movie_uses_known_vocabulary(self):
        for movie in MOVIES:
            self.assertIn(movie["language"], LANGUAGES)
            self.assertTrue(set(movie["genres"]) <= set(GENRES), movie["title"])
            self.assertTrue(set(movie["moods"]) <= set(MOODS), movie["title"])

    def test_semantic_network_is_symmetric(self):
        self.assertIn("Thriller", related_genres("Action"))
        self.assertIn("Action", related_genres("Thriller"))
        self.assertIn("feel-good", related_moods("funny"))
        self.assertIn("funny", related_moods("feel-good"))


if __name__ == "__main__":
    unittest.main()
