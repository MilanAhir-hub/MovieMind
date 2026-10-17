"""
Unit tests for the recommendation system.

Run from the backend folder:
    python -m unittest -v
"""

import unittest

from app import app
from heuristic import WEIGHTS, score_movie
from knowledge_base import ANY, load_movies, related_genres
from recommender import TOP_K, recommend, validate_preferences
from rule_engine import broken_constraints, forward_chain

MOVIES = load_movies()
BY_TITLE = {(m["title"], m["language"]): m for m in MOVIES}


def prefs(**changes):
    """Valid preferences with no restrictions, plus any changes."""
    return validate_preferences(changes)


class KnowledgeBaseTests(unittest.TestCase):
    def test_movies_load_and_ids_are_unique(self):
        self.assertGreaterEqual(len(MOVIES), 50)
        self.assertEqual(len({m["id"] for m in MOVIES}), len(MOVIES))

    def test_semantic_network_is_symmetric(self):
        self.assertIn("Thriller", related_genres("Action"))
        self.assertIn("Action", related_genres("Thriller"))


class RuleEngineTests(unittest.TestCase):
    def test_forward_chaining_infers_genre_from_mood(self):
        facts, fired = forward_chain({"genre": ANY, "mood": "funny"})
        self.assertEqual(facts["genre"], "Comedy")
        self.assertEqual([r["id"] for r in fired], ["I2"])

    def test_forward_chaining_infers_mood_from_genre(self):
        facts, _ = forward_chain({"genre": "Horror", "mood": ANY})
        self.assertEqual(facts["mood"], "scary")

    def test_no_rule_fires_when_everything_is_given(self):
        facts, fired = forward_chain({"genre": "Action", "mood": "funny"})
        self.assertEqual(fired, [])
        self.assertEqual(facts, {"genre": "Action", "mood": "funny"})

    def test_constraint_rules(self):
        titanic = BY_TITLE[("Titanic", "English")]          # 194 min, 7.9
        self.assertEqual(broken_constraints(titanic, prefs(max_duration=180)), ["C1"])
        self.assertEqual(broken_constraints(titanic, prefs(max_duration=200, min_rating=8)), ["C2"])
        self.assertEqual(broken_constraints(titanic, prefs(max_duration=200)), [])


class HeuristicTests(unittest.TestCase):
    def test_weights_sum_to_100(self):
        self.assertEqual(sum(WEIGHTS.values()), 100)

    def test_perfect_match_scores_100(self):
        kaithi = BY_TITLE[("Kaithi", "Tamil")]
        score, _ = score_movie(kaithi, prefs(genre="Action", language="Tamil", mood="action-packed",
                                             min_rating=8))
        self.assertEqual(score, 100)

    def test_related_genre_gets_half_points(self):
        kahaani = BY_TITLE[("Kahaani", "Hindi")]           # Thriller, Crime (no Action)
        _, breakdown = score_movie(kahaani, prefs(genre="Action"))
        genre = breakdown[0]
        self.assertEqual(genre["status"], "partial")
        self.assertEqual(genre["points"], WEIGHTS["genre"] / 2)

    def test_score_is_between_0_and_100(self):
        for movie in MOVIES:
            score, _ = score_movie(movie, prefs(genre="Horror", language="Korean", mood="romantic",
                                                max_duration=60, min_rating=9.5))
            self.assertTrue(0 <= score <= 100)


class RecommenderTests(unittest.TestCase):
    def test_returns_top_5_sorted_by_score(self):
        result = recommend(prefs(genre="Action", language="Hindi", mood="action-packed", min_rating=7), MOVIES)
        scores = [r["score"] for r in result["recommendations"]]
        self.assertEqual(len(scores), TOP_K)
        self.assertEqual(scores, sorted(scores, reverse=True))
        self.assertEqual(result["recommendations"][0]["title"], "Uri: The Surgical Strike")

    def test_hard_constraints_are_respected(self):
        result = recommend(prefs(max_duration=120, min_rating=7.5), MOVIES)
        for movie in result["recommendations"]:
            self.assertLessEqual(movie["duration"], 120)
            self.assertGreaterEqual(movie["rating"], 7.5)
        self.assertIsNone(result["trace"]["relaxation_message"])

    def test_relaxation_when_filters_are_too_strict(self):
        result = recommend(prefs(genre="Horror", language="Korean", max_duration=90, min_rating=8), MOVIES)
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


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_options_endpoint(self):
        data = self.client.get("/api/options").get_json()
        self.assertIn("Action", data["genres"])
        self.assertEqual(data["weights"], WEIGHTS)

    def test_recommend_endpoint(self):
        response = self.client.post("/api/recommend", json={"genre": "Comedy", "language": "Hindi"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.get_json()["recommendations"]), TOP_K)

    def test_recommend_endpoint_rejects_bad_input(self):
        response = self.client.post("/api/recommend", json={"mood": "sleepy"})
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.get_json())

    def test_home_page_is_served(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"MovieMind", response.data)
        response.close()


if __name__ == "__main__":
    unittest.main()
