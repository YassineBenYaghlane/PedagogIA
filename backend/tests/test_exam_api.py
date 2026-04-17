import pytest

from apps.exercises.exam import EXAM_LENGTH


@pytest.fixture
def student(auth_client):
    res = auth_client.post("/api/students/", {"display_name": "Max", "grade": "P2"}, format="json")
    return res.json()


@pytest.mark.django_db
def test_exam_start_requires_auth(api):
    res = api.post("/api/exam/start/", {"student_id": "x"}, format="json")
    assert res.status_code in (401, 403)


@pytest.mark.django_db
def test_exam_start_returns_first_question(auth_client, student):
    res = auth_client.post("/api/exam/start/", {"student_id": student["id"]}, format="json")
    assert res.status_code == 201, res.content
    body = res.json()
    assert body["length"] == EXAM_LENGTH
    q = body["question"]
    assert q is not None
    assert q["index"] == 0
    assert q["total"] == EXAM_LENGTH
    assert "signature" in q["exercise"]


@pytest.mark.django_db
def test_exam_feedback_hides_correct_answer(auth_client, student):
    start = auth_client.post(
        "/api/exam/start/", {"student_id": student["id"]}, format="json"
    ).json()
    sid = start["session_id"]
    sig = start["question"]["exercise"]["signature"]
    res = auth_client.post(
        f"/api/sessions/{sid}/attempts/",
        {"signature": sig, "student_answer": "0"},
        format="json",
    ).json()
    fb = res["feedback"]
    assert fb["message"] == "Réponse enregistrée."
    assert fb["can_explain"] is False


@pytest.mark.django_db
def test_exam_progresses(auth_client, student):
    start = auth_client.post(
        "/api/exam/start/", {"student_id": student["id"]}, format="json"
    ).json()
    sid = start["session_id"]
    sig = start["question"]["exercise"]["signature"]
    auth_client.post(
        f"/api/sessions/{sid}/attempts/",
        {"signature": sig, "student_answer": "0"},
        format="json",
    )
    nxt = auth_client.get(f"/api/exam/{sid}/next/").json()
    assert nxt["done"] is False
    assert nxt["answered"] == 1


@pytest.mark.django_db
def test_exam_result_has_score_and_breakdown(auth_client, student):
    start = auth_client.post(
        "/api/exam/start/", {"student_id": student["id"]}, format="json"
    ).json()
    sid = start["session_id"]
    res = auth_client.get(f"/api/exam/{sid}/result/").json()
    assert res["total_attempts"] == 0
    assert res["score"] == "0/0"
    assert res["breakdown"] == []
