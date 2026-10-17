"""Tests for recommender.py  —  AI concept 4: decision-making (relaxation, best-first selection)."""

import unittest

from helpers import MOVIES, prefs   # first: sets up the import path
from recommender import TOP_K, recommend, validate_preferences


class RecommenderTests(unittest.TestCase):
    def test_returns_top_5_sorted_by_score(self):
        result = recommend(prefs(genre="Action", language="Hindi", mood="action-packed", min_rating=7), MOVIES)
        scores = [r["score"] for r in result["recommendations"]]
        self.assertEqual(len(scores), TOP_K)
        self.assertEqual(scores, sorted(scores, reverse=True))
        best = result["recommendations"][0]
        self.assertEqual(best["language"], "Hindi")
        self.assertIn("Action", best["genres"])

    def test_hard_constraints_are_respected(self):
        result = recommend(prefs(max_duration=120, min_rating=7.5), MOVIES)
        for movie in result["recommendations"]:
            self.assertLessEqual(movie["duration"], 120)
            self.assertGreaterEqual(movie["rating"], 7.5)
        self.assertIsNone(result["trace"]["relaxation_message"])

    def test_relaxation_when_filters_are_too_strict(self):
        result = recommend(prefs(genre="Horror", max_duration=60, min_rating=9.5), MOVIES)
        self.assertLess(result["trace"]["passed_all_rules"], TOP_K)
        self.assertEqual(len(result["recommendations"]), TOP_K)
        duration_rule = result["trace"]["constraints"][0]
        self.assertEqual(duration_rule["id"], "C1")
        self.assertTrue(duration_rule["relaxed"])
        self.assertIsNotNone(result["trace"]["relaxation_message"])

    def test_every_recommendation_has_an_explanation(self):
        result = recommend(prefs(mood="romantic"), MOVIES)
        for movie in result["recommendations"]:
            self.assertTrue(movie["summary"])
            self.assertEqual(len(movie["breakdown"]), 5)

    def test_invalid_preferences_are_rejected(self):
        with self.assertRaises(ValueError):
            validate_preferences({"genre": "Cartoon"})
        with self.assertRaises(ValueError):
            validate_preferences({"min_rating": 9, "max_rating": 5})
        with self.assertRaises(ValueError):
            validate_preferences({"max_duration": "long"})


if __name__ == "__main__":
    unittest.main()
