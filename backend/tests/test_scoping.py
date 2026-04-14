import pytest
from rest_framework.test import APIClient

from apps.sessions.models import Session
from apps.students.models import Student


@pytest.mark.django_db
def test_cannot_see_other_parents_student(parent, other_parent):
    other_student = Student.objects.create(parent=other_parent, display_name="X", grade="P1")

    c = APIClient()
    c.force_authenticate(parent)

    res = c.get("/api/students/")
    assert res.status_code == 200
    assert res.json() == []

    res = c.get(f"/api/students/{other_student.id}/")
    assert res.status_code == 404


@pytest.mark.django_db
def test_cannot_create_session_for_other_student(parent, other_parent):
    other_student = Student.objects.create(parent=other_parent, display_name="X", grade="P1")
    c = APIClient()
    c.force_authenticate(parent)

    res = c.post(
        "/api/sessions/",
        {"student": str(other_student.id), "mode": "learn"},
        format="json",
    )
    assert res.status_code == 400


@pytest.mark.django_db
def test_cannot_read_other_session(parent, other_parent):
    other_student = Student.objects.create(parent=other_parent, display_name="X", grade="P1")
    other_session = Session.objects.create(student=other_student, mode="learn")
    c = APIClient()
    c.force_authenticate(parent)

    res = c.get(f"/api/sessions/{other_session.id}/")
    assert res.status_code == 404
