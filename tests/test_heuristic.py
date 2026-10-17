"""Tests for heuristic.py  —  AI concept 3: heuristic evaluation."""

import unittest

from helpers import BY_TITLE, MOVIES, prefs   # first: sets up the import path
from heuristic import WEIGHTS, score_movie, weighted_rating


class HeuristicTests(unittest.TestCase):
    def test_weights_sum_to_100(self):
        self.assertEqual(sum(WEIGHTS.values()), 100)

    def test_perfect_match_scores_100(self):
        kaithi = BY_TITLE[("Kaithi", "Tamil")]
        score, _ = score_movie(kaithi, prefs(genre="Action", language="Tamil", mood="action-packed",
                                             min_rating=7))
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

    def test_weighted_rating_trusts_more_votes(self):
        popular = {"rating": 8.8, "votes": 2_000_000}
        obscure = {"rating": 9.4, "votes": 3_000}
        self.assertGreater(weighted_rating(popular, 6.5), weighted_rating(obscure, 6.5))


if __name__ == "__main__":
    unittest.main()
