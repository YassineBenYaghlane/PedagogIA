"""Per-student JSON/PDF export and session summary endpoint."""

import json

import pytest

from apps.sessions.models import Session


@pytest.fixture
def student(auth_client):
    res = auth_client.post("/api/students/", {"display_name": "Eva", "grade": "P3"}, format="json")
    return res.json()


def _submit(auth_client, session_id, answer):
    start = auth_client.post(
        f"/api/sessions/{session_id}/start-practice/", {}, format="json"
    )  # not real; use diagnostic flow below
    return start


@pytest.mark.django_db
def test_session_summary_returns_list_for_student(auth_client, student):
    res = auth_client.get(f"/api/sessions/?summary=1&student={student['id']}")
    assert res.status_code == 200
    assert res.json() == []


@pytest.mark.django_db
def test_session_summary_rejects_missing_student(auth_client):
    res = auth_client.get("/api/sessions/?summary=1")
    assert res.status_code == 400


@pytest.mark.django_db
def test_session_summary_after_attempts(auth_client, student):
    start = auth_client.post(
        "/api/diagnostic/start/", {"student_id": student["id"]}, format="json"
    ).json()
    session_id = start["session_id"]
    sig = start["question"]["exercise"]["signature"]
    auth_client.post(
        f"/api/sessions/{session_id}/attempts/",
        {"signature": sig, "student_answer": "-999"},
        format="json",
    )
    # End session explicitly
    sess = Session.objects.get(id=session_id)
    from django.utils import timezone

    sess.ended_at = timezone.now()
    sess.save(update_fields=["ended_at"])

    res = auth_client.get(f"/api/sessions/?summary=1&student={student['id']}")
    assert res.status_code == 200
    body = res.json()
    assert len(body) == 1
    row = body[0]
    assert row["mode"] == "diagnostic"
    assert row["total_attempts"] == 1
    assert row["accuracy"] in (0.0, 1.0)
    assert "duration_seconds" in row


@pytest.mark.django_db
def test_export_json_returns_dump(auth_client, student):
    res = auth_client.get(f"/api/students/{student['id']}/export.json/")
    assert res.status_code == 200
    assert res["Content-Type"].startswith("application/json")
    assert "attachment" in res["Content-Disposition"]
    body = json.loads(res.content)
    assert body["student"]["id"] == student["id"]
    assert "sessions" in body
    assert "attempts" in body
    assert "mastery" in body


@pytest.mark.django_db
def test_export_pdf_returns_pdf_bytes(auth_client, student):
    res = auth_client.get(f"/api/students/{student['id']}/export.pdf/")
    assert res.status_code == 200
    assert res["Content-Type"] == "application/pdf"
    assert "attachment" in res["Content-Disposition"]
    assert res.content[:4] == b"%PDF"


@pytest.mark.django_db
def test_export_other_users_student_forbidden(auth_client, other_user):
    from apps.students.models import Student

    other_student = Student.objects.create(user=other_user, display_name="Z", grade="P2")
    res = auth_client.get(f"/api/students/{other_student.id}/export.json/")
    assert res.status_code in (403, 404)
    res = auth_client.get(f"/api/students/{other_student.id}/export.pdf/")
    assert res.status_code in (403, 404)
