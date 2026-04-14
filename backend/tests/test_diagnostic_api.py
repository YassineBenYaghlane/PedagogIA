import pytest

from apps.exercises.diagnostic import (
    DIAGNOSTIC_LENGTH,
    _compute_level,
    _level_to_target,
    _starting_level,
)


@pytest.fixture
def student(auth_client):
    res = auth_client.post("/api/students/", {"display_name": "Eva", "grade": "P3"}, format="json")
    return res.json()


@pytest.mark.django_db
def test_starting_level_matches_student_grade():
    lvl = _starting_level("P3")
    grade, difficulty = _level_to_target(lvl)
    assert grade == "P3"
    assert difficulty == 1


@pytest.mark.django_db
def test_level_ramps_up_with_correct_answers():
    class FakeAttempt:
        def __init__(self, ok):
            self.is_correct = ok

    start = _starting_level("P3")
    wins = [FakeAttempt(True) for _ in range(3)]
    assert _compute_level("P3", wins) == start + 3
    losses = [FakeAttempt(False) for _ in range(2)]
    assert _compute_level("P3", losses) == start - 2


@pytest.mark.django_db
def test_start_requires_auth(api):
    res = api.post("/api/diagnostic/start/", {"student_id": "x"}, format="json")
    assert res.status_code in (401, 403)


@pytest.mark.django_db
def test_start_returns_first_question(auth_client, student):
    res = auth_client.post("/api/diagnostic/start/", {"student_id": student["id"]}, format="json")
    assert res.status_code == 201, res.content
    body = res.json()
    assert body["student_id"] == student["id"]
    assert body["length"] == DIAGNOSTIC_LENGTH
    q = body["question"]
    assert q["index"] == 0
    assert q["total"] == DIAGNOSTIC_LENGTH
    assert q["difficulty"] in (1, 2, 3)
    assert "signature" in q["exercise"]


@pytest.mark.django_db
def test_next_advances_after_attempts(auth_client, student):
    start = auth_client.post(
        "/api/diagnostic/start/", {"student_id": student["id"]}, format="json"
    ).json()
    session_id = start["session_id"]
    sig = start["question"]["exercise"]["signature"]
    submit = auth_client.post(
        f"/api/sessions/{session_id}/attempts/",
        {"signature": sig, "student_answer": "0"},
        format="json",
    )
    assert submit.status_code == 201, submit.content

    nxt = auth_client.get(f"/api/diagnostic/{session_id}/next/").json()
    assert nxt["done"] is False
    assert nxt["answered"] == 1
    assert nxt["question"]["index"] == 1


@pytest.mark.django_db
def test_result_includes_grade_breakdown(auth_client, student):
    start = auth_client.post(
        "/api/diagnostic/start/", {"student_id": student["id"]}, format="json"
    ).json()
    session_id = start["session_id"]
    cur = start["question"]
    for _ in range(3):
        sig = cur["exercise"]["signature"]
        auth_client.post(
            f"/api/sessions/{session_id}/attempts/",
            {"signature": sig, "student_answer": "-999"},
            format="json",
        )
        cur = auth_client.get(f"/api/diagnostic/{session_id}/next/").json()["question"]

    res = auth_client.get(f"/api/diagnostic/{session_id}/result/").json()
    assert res["total_attempts"] == 3
    assert isinstance(res["skills"], list)
    assert isinstance(res["grades"], list)
    assert len(res["grades"]) >= 1
    for g in res["grades"]:
        assert g["grade"] in {"P1", "P2", "P3", "P4", "P5", "P6"}
        assert g["bucket"] in ("green", "orange", "red")
        assert {"green", "orange", "red", "skills_count"} <= set(g.keys())


@pytest.mark.django_db
def test_cannot_access_other_parents_diagnostic(auth_client, other_parent):
    from apps.sessions.models import Session
    from apps.students.models import Student

    other_student = Student.objects.create(parent=other_parent, display_name="Z", grade="P2")
    sess = Session.objects.create(student=other_student, mode="diagnostic")
    res = auth_client.get(f"/api/diagnostic/{sess.id}/next/")
    assert res.status_code == 404
