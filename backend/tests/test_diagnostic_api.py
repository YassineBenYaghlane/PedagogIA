import pytest

from apps.exercises.diagnostic import DIAGNOSTIC_LENGTH, build_plan


@pytest.fixture
def student(auth_client):
    res = auth_client.post("/api/students/", {"display_name": "Eva", "grade": "P3"}, format="json")
    return res.json()


@pytest.mark.django_db
def test_plan_is_balanced_and_capped(db, parent):
    from apps.students.models import Student

    s = Student.objects.create(parent=parent, display_name="X", grade="P3")
    plan = build_plan(s, session_id="fixed-seed-123")
    assert len(plan) == DIAGNOSTIC_LENGTH
    assert len({slot.skill_id for slot in plan}) == len(plan)
    # at least three different categories represented
    cats = {slot.skill_id.split("_", 1)[0] for slot in plan}
    assert len(cats) >= 3


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
def test_result_shape(auth_client, student):
    start = auth_client.post(
        "/api/diagnostic/start/", {"student_id": student["id"]}, format="json"
    ).json()
    session_id = start["session_id"]
    # submit a few wrong answers to populate result
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
    assert res["session_id"] == session_id
    assert res["total_attempts"] == 3
    assert isinstance(res["skills"], list)
    assert len(res["skills"]) == 3
    for entry in res["skills"]:
        assert entry["bucket"] in ("green", "orange", "red")
    assert "strengths" in res and "weaknesses" in res


@pytest.mark.django_db
def test_cannot_access_other_parents_diagnostic(auth_client, other_parent):
    from apps.sessions.models import Session
    from apps.students.models import Student

    other_student = Student.objects.create(parent=other_parent, display_name="Z", grade="P2")
    sess = Session.objects.create(student=other_student, mode="diagnostic")
    res = auth_client.get(f"/api/diagnostic/{sess.id}/next/")
    assert res.status_code == 404
