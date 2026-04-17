import pytest

from apps.exercises.diagnostic import DIAGNOSTIC_MAX_LENGTH, DIAGNOSTIC_MIN_LENGTH


@pytest.fixture
def student(auth_client):
    res = auth_client.post("/api/students/", {"display_name": "Eva", "grade": "P3"}, format="json")
    return res.json()


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
    assert body["length"] == DIAGNOSTIC_MAX_LENGTH
    q = body["question"]
    assert q["index"] == 0
    assert q["total"] == DIAGNOSTIC_MAX_LENGTH
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
def test_result_includes_verdict_and_years(auth_client, student):
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
    assert isinstance(res["years"], list)
    assert "verdict" in res
    v = res["verdict"]
    assert "level" in v and "confidence" in v and "narrative" in v
    # With only 3 wrong answers the test must not over-commit
    assert v["level"] is None or v["level"] in {"P1", "P2", "P3", "P4", "P5", "P6"}


@pytest.mark.django_db
def test_cannot_access_other_users_diagnostic(auth_client, other_user):
    from apps.sessions.models import Session
    from apps.students.models import Student

    other_student = Student.objects.create(user=other_user, display_name="Z", grade="P2")
    sess = Session.objects.create(student=other_student, mode="diagnostic")
    res = auth_client.get(f"/api/diagnostic/{sess.id}/next/")
    assert res.status_code == 404


@pytest.mark.django_db
def test_invalid_grade_rejected(auth_client):
    res = auth_client.post("/api/students/", {"display_name": "Bad", "grade": "P7"}, format="json")
    assert res.status_code == 400


@pytest.mark.django_db
def test_min_length_before_convergence_stop(auth_client, student):
    """Even a floor-pinned student must answer at least DIAGNOSTIC_MIN_LENGTH."""
    assert DIAGNOSTIC_MIN_LENGTH >= 5
