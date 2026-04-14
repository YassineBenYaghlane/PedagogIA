import pytest

from apps.exercises.drill import DRILL_LENGTH


@pytest.fixture
def student(auth_client):
    res = auth_client.post("/api/students/", {"display_name": "Max", "grade": "P2"}, format="json")
    return res.json()


@pytest.mark.django_db
def test_drill_start_requires_auth(api):
    res = api.post("/api/drill/start/", {"student_id": "x"}, format="json")
    assert res.status_code in (401, 403)


@pytest.mark.django_db
def test_drill_start_returns_automatisme(auth_client, student):
    res = auth_client.post("/api/drill/start/", {"student_id": student["id"]}, format="json")
    assert res.status_code == 201, res.content
    body = res.json()
    assert body["length"] == DRILL_LENGTH
    q = body["question"]
    assert q is not None
    assert "signature" in q["exercise"]


@pytest.mark.django_db
def test_drill_progresses(auth_client, student):
    start = auth_client.post(
        "/api/drill/start/", {"student_id": student["id"]}, format="json"
    ).json()
    sid = start["session_id"]
    sig = start["question"]["exercise"]["signature"]
    auth_client.post(
        f"/api/sessions/{sid}/attempts/",
        {"signature": sig, "student_answer": "0"},
        format="json",
    )
    nxt = auth_client.get(f"/api/drill/{sid}/next/").json()
    assert nxt["done"] is False
    assert nxt["answered"] == 1


@pytest.mark.django_db
def test_drill_summary_contains_streak(auth_client, student):
    start = auth_client.post(
        "/api/drill/start/", {"student_id": student["id"]}, format="json"
    ).json()
    sid = start["session_id"]
    res = auth_client.get(f"/api/drill/{sid}/result/").json()
    assert res["total_attempts"] == 0
    assert res["best_streak"] == 0
    assert res["accuracy"] == 0.0
