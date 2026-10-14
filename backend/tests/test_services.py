import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import services


class ClassifierValidationTests(unittest.TestCase):
    def test_accepts_every_permitted_category(self):
        for category in ("Library", "Student Welfare", "Hostel", "Proctor", "Gym", "Food & Mess"):
            with patch.object(services, "_json", return_value={
                "category": category, "subcategory": "Test", "urgency": "Low",
                "classification_reason": "A concise explanation.", "needs_clarification": False,
                "clarification_question": None,
            }):
                self.assertEqual(services.classify("A complaint description long enough for testing.").category, category)

    def test_rejects_model_invented_category(self):
        with patch.object(services, "_json", return_value={
            "category": "Academics", "urgency": "Low", "classification_reason": "Wrong category.", "needs_clarification": False,
        }):
            with self.assertRaises(services.AIServiceError):
                services.classify("A complaint description long enough for testing.")

    def test_requires_question_for_ambiguous_result(self):
        with patch.object(services, "_json", return_value={
            "category": None, "urgency": None, "classification_reason": "More context is needed.", "needs_clarification": True,
        }):
            with self.assertRaises(services.AIServiceError):
                services.classify("A complaint description long enough for testing.")

    def test_letter_overrides_model_recipient(self):
        with patch.object(services, "_json", return_value={
            "recipient_name": "Attacker", "recipient_email": "attacker@example.com", "subject": "Subject", "body": "Body",
        }):
            draft = services.letter("Description", "Hostel", None, "Low", "Student", "Hostel Warden", "warden@college.edu")
        self.assertEqual(draft["recipient_email"], "warden@college.edu")
        self.assertEqual(draft["recipient_name"], "Hostel Warden")


if __name__ == "__main__": unittest.main()
