"""Tests for rule_engine.py  —  AI concept 2: rule-based reasoning."""

import unittest

from helpers import BY_TITLE, prefs   # first: sets up the import path
from knowledge_base import ANY
from rule_engine import broken_constraints, forward_chain


class ForwardChainingTests(unittest.TestCase):
    def test_infers_genre_from_mood(self):
        facts, fired = forward_chain({"genre": ANY, "mood": "funny"})
        self.assertEqual(facts["genre"], "Comedy")
        self.assertEqual([r["id"] for r in fired], ["I2"])

    def test_infers_mood_from_genre(self):
        facts, _ = forward_chain({"genre": "Horror", "mood": ANY})
        self.assertEqual(facts["mood"], "scary")

    def test_no_rule_fires_when_everything_is_given(self):
        facts, fired = forward_chain({"genre": "Action", "mood": "funny"})
        self.assertEqual(fired, [])
        self.assertEqual(facts, {"genre": "Action", "mood": "funny"})


class ConstraintRuleTests(unittest.TestCase):
    def test_duration_and_rating_rules(self):
        titanic = BY_TITLE[("Titanic", "English")]          # 194 min
        too_high = titanic["rating"] + 0.1
        self.assertEqual(broken_constraints(titanic, prefs(max_duration=180)), ["C1"])
        self.assertEqual(broken_constraints(titanic, prefs(max_duration=200, min_rating=too_high)), ["C2"])
        self.assertEqual(broken_constraints(titanic, prefs(max_duration=200)), [])


if __name__ == "__main__":
    unittest.main()
