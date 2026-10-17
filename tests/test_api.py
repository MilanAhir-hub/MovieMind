"""Tests for app.py  —  the Flask REST API and web page."""

import unittest

from helpers import MOVIES   # first: sets up the import path
from app import app
from heuristic import WEIGHTS
from recommender import TOP_K


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_options_endpoint(self):
        data = self.client.get("/api/options").get_json()
        self.assertIn("Action", data["genres"])
        self.assertEqual(data["weights"], WEIGHTS)
        self.assertEqual(data["movie_count"], len(MOVIES))

    def test_movies_endpoint_search(self):
        data = self.client.get("/api/movies?search=inception&limit=5").get_json()
        self.assertEqual(data["total"], len(MOVIES))
        self.assertGreaterEqual(data["matches"], 1)
        self.assertTrue(all("inception" in m["title"].lower() for m in data["movies"]))

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
