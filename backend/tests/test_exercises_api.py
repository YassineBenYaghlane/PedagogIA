import pytest


@pytest.mark.django_db
def test_generate_requires_auth(api):
    res = api.get("/api/exercises/generate/?skill_id=add_avec_retenue_20&difficulty=1")
    assert res.status_code in (401, 403)


@pytest.mark.django_db
def test_generate_ok(auth_client):
    res = auth_client.get("/api/exercises/generate/?skill_id=add_avec_retenue_20&difficulty=1")
    assert res.status_code == 200
    body = res.json()
    for key in ("template_id", "skill_id", "difficulty", "type", "prompt", "params", "signature"):
        assert key in body
    assert "answer" not in body
    assert body["skill_id"] == "add_avec_retenue_20"


@pytest.mark.django_db
def test_generate_missing_skill(auth_client):
    res = auth_client.get("/api/exercises/generate/")
    assert res.status_code == 400


@pytest.mark.django_db
def test_next_returns_exercise_for_own_student(auth_client):
    student = auth_client.post(
        "/api/students/", {"display_name": "A", "grade": "P1"}, format="json"
    ).json()
    res = auth_client.get(f"/api/exercises/next/?student_id={student['id']}")
    assert res.status_code == 200, res.content
    body = res.json()
    assert body["student_id"] == student["id"]
    assert "skill" in body and "exercise" in body
    assert "signature" in body["exercise"]


@pytest.mark.django_db
def test_next_404_for_other_users_student(auth_client, other_user):
    from apps.students.models import Student

    other = Student.objects.create(user=other_user, display_name="X", grade="P1")
    res = auth_client.get(f"/api/exercises/next/?student_id={other.id}")
    assert res.status_code == 404


@pytest.mark.django_db
def test_next_requires_student_id(auth_client):
    res = auth_client.get("/api/exercises/next/")
    assert res.status_code == 400
