import unittest
from types import SimpleNamespace

from app.services.scout import parse_scout_text, run_scout


def listing(**kwargs):
    defaults = dict(
        id=1,
        title="Room",
        location="Cornell Heights, Ithaca",
        rent_price=750,
        bedrooms=1,
        bathrooms=1,
        available_from="2027-08-01",
        lease_length=12,
        amenities=[],
        building_features=[],
        custom_tags=[],
        description="",
    )
    defaults.update(kwargs)
    return SimpleNamespace(**defaults)


QUERY = (
    "Find a room below $800 near Cornell for August 2027–August 2028, "
    "including semester alternatives."
)


class ScoutTests(unittest.TestCase):
    def test_parse_keeps_budget_place_and_window(self):
        parsed = parse_scout_text(QUERY)
        self.assertEqual(parsed.max_rent, 800)
        self.assertEqual(parsed.location, "Cornell")
        self.assertEqual(parsed.start.isoformat(), "2027-08-01")
        self.assertEqual(parsed.end.isoformat(), "2028-08-01")
        self.assertTrue(parsed.semester_alternatives)

    def test_hard_budget_is_not_relaxed(self):
        parsed = parse_scout_text(QUERY)
        report = run_scout(
            [listing(id=1, rent_price=800), listing(id=2, rent_price=801, title="Too expensive")],
            parsed,
        )
        ids = [item["id"] for item in report["results"]]
        self.assertEqual(ids, [1])
        self.assertEqual(report["excluded"]["over_budget"], 1)
        self.assertFalse(report["learned_ranking"])

    def test_unknown_availability_is_not_treated_as_available(self):
        parsed = parse_scout_text(QUERY)
        report = run_scout([listing(id=3, available_from="Flexible")], parsed)
        self.assertEqual(report["results"], [])
        unknown = report["excluded"]["availability_unknown"]
        self.assertEqual(unknown[0]["id"], 3)
        self.assertIn("not assumed", unknown[0]["reason"])

    def test_semester_alternative_is_labeled(self):
        parsed = parse_scout_text(QUERY)
        report = run_scout([listing(id=4, available_from="2028-01-10", lease_length=5)], parsed)
        result = report["results"][0]
        self.assertEqual(result["match_type"], "semester_alternative")
        self.assertTrue(any("semester alternative" in item for item in result["compromises"]))
        self.assertTrue(any("lease" in item.lower() for item in result["compromises"]))
        self.assertEqual(result["availability"]["available_from"], "2028-01-10")

    def test_duplicate_keeps_the_dated_listing(self):
        parsed = parse_scout_text(QUERY)
        dated = listing(id=6, available_from="2027-08-01")
        undated = listing(id=5, available_from="Flexible")
        report = run_scout([undated, dated], parsed)
        self.assertEqual([item["id"] for item in report["results"]], [6])
        self.assertEqual(report["excluded"]["duplicates"][0]["kept_id"], 6)

    def test_questions_do_not_invent_missing_facts(self):
        parsed = parse_scout_text(QUERY)
        report = run_scout([listing(id=7, lease_length=None, description="quiet room")], parsed)
        questions = report["results"][0]["questions"]
        self.assertIn("Are utilities included, and which ones?", questions)
        self.assertIn("What lease length is actually offered?", questions)
        self.assertTrue(any(question.startswith("Is the unit still available from") for question in questions))


if __name__ == "__main__":
    unittest.main()
