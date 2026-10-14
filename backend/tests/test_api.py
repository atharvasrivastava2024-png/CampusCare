"""Offline API tests. Groq and Gmail are replaced with deterministic fakes."""
import os
import sys
import tempfile
import unittest
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))
db_file = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
db_file.close()
os.environ["DATABASE_URL"] = f"sqlite:///{db_file.name}"

from fastapi.testclient import TestClient
import app as api
from database import Base, engine
from models import AuthorityMapping
from schemas import Classification
from security import Identity, current_identity


class CampusCareApiTests(unittest.TestCase):
    def setUp(self):
        Base.metadata.drop_all(bind=engine); Base.metadata.create_all(bind=engine)
        api.app.dependency_overrides[current_identity] = lambda: Identity("student-a", "a@college.edu", "Student A")
        api.classify = lambda *_args, **_kwargs: Classification(category="Hostel", subcategory="Maintenance", urgency="Medium", classification_reason="The report concerns hostel maintenance.", needs_clarification=False)
        api.letter = lambda *_args, **_kwargs: {"recipient_name":"Hostel Warden", "recipient_email":"warden@college.edu", "subject":"Hostel maintenance concern", "body":"Dear Hostel Warden,\n\nPlease review this concern."}
        api.generate_letter = lambda *_args, **_kwargs: {"subject":"Hostel maintenance concern", "body":"Dear College Authority,\n\nPlease review this concern."}
        self.client = TestClient(api.app)

    def tearDown(self): api.app.dependency_overrides.clear()

    def seed_authority(self):
        from database import SessionLocal
        db = SessionLocal(); db.add(AuthorityMapping(category="Hostel", authority_name="Hostel Warden", official_email="warden@college.edu")); db.commit(); db.close()

    def test_rejects_unauthenticated_complaint(self):
        api.app.dependency_overrides.clear()
        response = self.client.post("/api/complaints", json={"description":"The hostel bathroom ceiling has leaked for two weeks."})
        self.assertEqual(response.status_code, 401)

    def test_create_edit_and_gmail_unavailable(self):
        self.seed_authority()
        created = self.client.post("/api/complaints", json={"description":"The hostel bathroom ceiling has leaked for two weeks."})
        self.assertEqual(created.status_code, 201); data = created.json(); self.assertEqual(data["status"], "Awaiting Approval")
        complaint_id = data["id"]
        self.assertEqual(self.client.patch(f"/api/complaints/{complaint_id}/draft", json={"body":"Edited, factual letter."}).status_code, 200)
        sent = self.client.post(f"/api/complaints/{complaint_id}/approve-send")
        self.assertEqual(sent.status_code, 503); self.assertIn("not configured", sent.json()["detail"])
        self.assertEqual(self.client.post(f"/api/complaints/{complaint_id}/approve-send").status_code, 409)

    def test_missing_authority_is_actionable(self):
        response = self.client.post("/api/complaints", json={"description":"The hostel bathroom ceiling has leaked for two weeks."})
        self.assertEqual(response.status_code, 409); self.assertIn("authority mapping", response.json()["detail"])

    def test_prototype_analysis_returns_letter_and_mapping_warning(self):
        response = self.client.post("/api/student-complaints/analyze", json={"description":"The hostel bathroom ceiling has leaked for two weeks."})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["draft"]["subject"], "Hostel maintenance concern")
        self.assertIsNone(data["draft"]["recipient_email"])
        self.assertIn("authority mapping", data["authority_error"])

    def test_student_cannot_read_another_students_complaint(self):
        self.seed_authority()
        complaint_id = self.client.post("/api/complaints", json={"description":"The hostel bathroom ceiling has leaked for two weeks."}).json()["id"]
        api.app.dependency_overrides[current_identity] = lambda: Identity("student-b", "b@college.edu", "Student B")
        self.assertEqual(self.client.get(f"/api/complaints/{complaint_id}").status_code, 404)


if __name__ == "__main__": unittest.main()
