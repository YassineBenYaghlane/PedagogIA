import pytest
from rest_framework.test import APIClient

from apps.students.models import Student


@pytest.mark.django_db
def test_patch_owned_student(auth_client):
    created = auth_client.post(
        "/api/students/", {"display_name": "Léo", "grade": "P2"}, format="json"
    ).json()

    res = auth_client.patch(
        f"/api/students/{created['id']}/",
        {"display_name": "Léo R", "grade": "P3"},
        format="json",
    )
    assert res.status_code == 200, res.content
    body = res.json()
    assert body["display_name"] == "Léo R"
    assert body["grade"] == "P3"


@pytest.mark.django_db
def test_patch_invalid_grade(auth_client):
    created = auth_client.post(
        "/api/students/", {"display_name": "Léo", "grade": "P2"}, format="json"
    ).json()
    res = auth_client.patch(f"/api/students/{created['id']}/", {"grade": "P9"}, format="json")
    assert res.status_code == 400


@pytest.mark.django_db
def test_patch_cross_parent_404(user, other_user):
    other_student = Student.objects.create(user=other_user, display_name="X", grade="P1")
    c = APIClient()
    c.force_authenticate(user)
    res = c.patch(f"/api/students/{other_student.id}/", {"display_name": "stolen"}, format="json")
    assert res.status_code == 404


@pytest.mark.django_db
def test_delete_cascades_attempts_and_sessions(auth_client):
    from apps.exercises.models import Attempt
    from apps.sessions.models import Session

    student = auth_client.post(
        "/api/students/", {"display_name": "A", "grade": "P1"}, format="json"
    ).json()
    session = auth_client.post(
        "/api/sessions/", {"student": student["id"], "mode": "learn"}, format="json"
    ).json()

    ex = auth_client.get(
        "/api/exercises/generate/?skill_id=add_avec_retenue_20&difficulty=1"
    ).json()
    auth_client.post(
        f"/api/sessions/{session['id']}/attempts/",
        {"signature": ex["signature"], "student_answer": "3"},
        format="json",
    )

    assert Session.objects.filter(student_id=student["id"]).exists()
    assert Attempt.objects.filter(session_id=session["id"]).exists()

    res = auth_client.delete(f"/api/students/{student['id']}/")
    assert res.status_code == 204

    assert not Student.objects.filter(id=student["id"]).exists()
    assert not Session.objects.filter(student_id=student["id"]).exists()
    assert not Attempt.objects.filter(session_id=session["id"]).exists()


@pytest.mark.django_db
def test_delete_cross_parent_404(user, other_user):
    other_student = Student.objects.create(user=other_user, display_name="X", grade="P1")
    c = APIClient()
    c.force_authenticate(user)
    res = c.delete(f"/api/students/{other_student.id}/")
    assert res.status_code == 404
