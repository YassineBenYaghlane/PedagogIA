import pytest


@pytest.mark.django_db
def test_student_crud(auth_client):
    res = auth_client.post("/api/students/", {"display_name": "Léo", "grade": "P2"}, format="json")
    assert res.status_code == 201
    sid = res.json()["id"]

    res = auth_client.get("/api/students/")
    assert res.status_code == 200
    assert len(res.json()) == 1

    res = auth_client.patch(f"/api/students/{sid}/", {"display_name": "Léo B"}, format="json")
    assert res.status_code == 200
    assert res.json()["display_name"] == "Léo B"

    res = auth_client.delete(f"/api/students/{sid}/")
    assert res.status_code == 204


@pytest.mark.django_db
def test_attempt_updates_skill_state(auth_client):
    student = auth_client.post(
        "/api/students/", {"display_name": "A", "grade": "P1"}, format="json"
    ).json()
    session = auth_client.post(
        "/api/sessions/",
        {"student": student["id"], "mode": "learn"},
        format="json",
    ).json()

    ex = auth_client.get(
        "/api/exercises/generate/?skill_id=add_avec_retenue_20&difficulty=1"
    ).json()

    res = auth_client.post(
        f"/api/sessions/{session['id']}/attempts/",
        {"signature": ex["signature"], "student_answer": "999999"},
        format="json",
    )
    assert res.status_code == 201, res.content
    body = res.json()
    assert body["attempt"]["is_correct"] is False
    assert body["feedback"]["is_correct"] is False
    assert "message" in body["feedback"]

    from apps.students.models import StudentSkillState

    state = StudentSkillState.objects.get(student_id=student["id"], skill_id="add_avec_retenue_20")
    assert state.total_attempts == 1
    assert state.consecutive_correct == 0


@pytest.mark.django_db
def test_attempt_signature_required(auth_client):
    student = auth_client.post(
        "/api/students/", {"display_name": "A", "grade": "P1"}, format="json"
    ).json()
    session = auth_client.post(
        "/api/sessions/", {"student": student["id"], "mode": "learn"}, format="json"
    ).json()

    res = auth_client.post(
        f"/api/sessions/{session['id']}/attempts/",
        {"signature": "tampered", "student_answer": "13"},
        format="json",
    )
    assert res.status_code == 400


@pytest.mark.django_db
def test_unauthenticated_cannot_list_or_create(api):
    assert api.get("/api/students/").status_code in (401, 403)
    res = api.post("/api/students/", {"display_name": "X", "grade": "P1"}, format="json")
    assert res.status_code in (401, 403)
