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
        {"student": student["id"], "mode": "training"},
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
    assert state.skill_xp == 0.0


@pytest.mark.django_db
def test_attempt_signature_required(auth_client):
    student = auth_client.post(
        "/api/students/", {"display_name": "A", "grade": "P1"}, format="json"
    ).json()
    session = auth_client.post(
        "/api/sessions/", {"student": student["id"], "mode": "training"}, format="json"
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


@pytest.mark.django_db
def test_skill_tree_endpoint_returns_all_skills(auth_client):
    from apps.skills.models import Skill

    student = auth_client.post(
        "/api/students/", {"display_name": "A", "grade": "P1"}, format="json"
    ).json()

    res = auth_client.get(f"/api/students/{student['id']}/skill-tree/")
    assert res.status_code == 200
    payload = res.json()
    assert len(payload) == Skill.objects.count()
    row = payload[0]
    assert set(row.keys()) == {
        "skill_id",
        "status",
        "mastery_level",
        "skill_xp",
        "total_attempts",
        "last_practiced_at",
        "needs_review",
    }
    assert all(r["status"] == "not_started" for r in payload)
    assert all(r["mastery_level"] == 0.0 for r in payload)


@pytest.mark.django_db
def test_skill_tree_reflects_mastery(auth_client):
    from apps.exercises.models import ExerciseTemplate
    from apps.skills.models import Skill
    from apps.students.models import Student
    from apps.students.services.mastery import apply_template_attempt

    student = auth_client.post(
        "/api/students/", {"display_name": "A", "grade": "P1"}, format="json"
    ).json()
    skill = Skill.objects.get(id="add_avec_retenue_20")
    template = ExerciseTemplate.objects.filter(skills=skill).first()
    assert template is not None
    apply_template_attempt(Student.objects.get(id=student["id"]), template, is_correct=True)

    res = auth_client.get(f"/api/students/{student['id']}/skill-tree/")
    row = next(r for r in res.json() if r["skill_id"] == "add_avec_retenue_20")
    assert row["status"] in {"learning_easy", "learning_medium", "learning_hard"}
    assert row["total_attempts"] == 1
    assert row["skill_xp"] > 0
    assert row["mastery_level"] > 0
    assert row["last_practiced_at"] is not None


@pytest.mark.django_db
def test_skill_tree_scoped_to_owner(auth_client, other_user, api):
    mine = auth_client.post(
        "/api/students/", {"display_name": "Mine", "grade": "P1"}, format="json"
    ).json()
    api.force_authenticate(other_user)
    res = api.get(f"/api/students/{mine['id']}/skill-tree/")
    assert res.status_code == 404


@pytest.mark.django_db
def test_new_p5_student_has_prior_grades_mastered(auth_client):
    from apps.skills.models import Skill

    student = auth_client.post(
        "/api/students/", {"display_name": "Aïda", "grade": "P5"}, format="json"
    ).json()
    res = auth_client.get(f"/api/students/{student['id']}/skill-tree/")
    by_id = {r["skill_id"]: r for r in res.json()}

    prior_ids = list(Skill.objects.filter(grade__lt="P5").values_list("id", flat=True))
    current_ids = list(Skill.objects.filter(grade__gte="P5").values_list("id", flat=True))
    assert prior_ids, "expected prior-grade skills to exist"
    for sid in prior_ids:
        assert by_id[sid]["status"] == "mastered"
        assert by_id[sid]["mastery_level"] == 1.0
    for sid in current_ids:
        assert by_id[sid]["status"] == "not_started"


@pytest.mark.django_db
def test_new_p1_student_has_nothing_seeded(auth_client):
    student = auth_client.post(
        "/api/students/", {"display_name": "Bébé", "grade": "P1"}, format="json"
    ).json()
    res = auth_client.get(f"/api/students/{student['id']}/skill-tree/")
    assert all(r["status"] == "not_started" for r in res.json())
