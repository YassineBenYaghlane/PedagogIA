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
def test_attempt_updates_skill_state(auth_client, parent):
    student = auth_client.post(
        "/api/students/", {"display_name": "A", "grade": "P1"}, format="json"
    ).json()
    session = auth_client.post(
        "/api/sessions/",
        {"student": student["id"], "mode": "learn"},
        format="json",
    ).json()

    res = auth_client.post(
        f"/api/sessions/{session['id']}/attempts/",
        {
            "skill": "add_avec_retenue_20",
            "template": "add_avec_retenue_20__computation_1",
            "exercise_params": {"a": 6, "b": 7},
            "student_answer": "13",
            "correct_answer": "13",
            "is_correct": True,
        },
        format="json",
    )
    assert res.status_code == 201, res.content

    from apps.students.models import StudentSkillState

    state = StudentSkillState.objects.get(student_id=student["id"], skill_id="add_avec_retenue_20")
    assert state.total_attempts == 1
    assert state.consecutive_correct == 1
    assert state.mastery_level > 0
