"""GET /api/parent/overview/ — account-wide dashboard payload."""

from datetime import timedelta

import pytest
from django.utils import timezone


@pytest.mark.django_db
def test_overview_requires_auth(api):
    res = api.get("/api/parent/overview/")
    assert res.status_code in (401, 403)


@pytest.mark.django_db
def test_overview_empty_account(auth_client):
    res = auth_client.get("/api/parent/overview/")
    assert res.status_code == 200
    assert res.json() == {"students": []}


@pytest.mark.django_db
def test_overview_shape(auth_client):
    auth_client.post("/api/students/", {"display_name": "Léo", "grade": "P2"}, format="json")

    res = auth_client.get("/api/parent/overview/")
    assert res.status_code == 200
    body = res.json()
    assert len(body["students"]) == 1
    s = body["students"][0]

    assert set(s.keys()) >= {
        "id",
        "display_name",
        "grade",
        "created_at",
        "gamification",
        "mastery_summary",
        "recent_sessions",
        "last_7_days",
    }
    assert s["display_name"] == "Léo"
    assert s["grade"] == "P2"

    gami = s["gamification"]
    assert set(gami.keys()) == {
        "xp",
        "rank",
        "current_streak",
        "best_streak",
        "last_activity_date",
        "daily_goal",
        "daily_progress",
    }

    mastery = s["mastery_summary"]
    assert set(mastery.keys()) == {
        "not_started",
        "learning_easy",
        "learning_medium",
        "learning_hard",
        "mastered",
        "needs_review",
    }

    assert s["recent_sessions"] == []

    week = s["last_7_days"]
    assert set(week.keys()) == {"sessions", "attempts", "accuracy", "by_day"}
    assert len(week["by_day"]) == 7
    assert all(d["attempts"] == 0 for d in week["by_day"])


@pytest.mark.django_db
def test_overview_sorted_by_display_name(auth_client):
    auth_client.post("/api/students/", {"display_name": "Zoé", "grade": "P1"}, format="json")
    auth_client.post("/api/students/", {"display_name": "Ana", "grade": "P1"}, format="json")
    auth_client.post("/api/students/", {"display_name": "Milo", "grade": "P1"}, format="json")

    res = auth_client.get("/api/parent/overview/")
    names = [s["display_name"] for s in res.json()["students"]]
    assert names == ["Ana", "Milo", "Zoé"]


@pytest.mark.django_db
def test_overview_scoped_to_requesting_user(auth_client, other_user, api):
    auth_client.post("/api/students/", {"display_name": "Mine", "grade": "P1"}, format="json")

    from apps.students.models import Student

    Student.objects.create(user=other_user, display_name="Theirs", grade="P3")

    res = auth_client.get("/api/parent/overview/")
    names = [s["display_name"] for s in res.json()["students"]]
    assert names == ["Mine"]

    api.force_authenticate(other_user)
    res = api.get("/api/parent/overview/")
    names = [s["display_name"] for s in res.json()["students"]]
    assert names == ["Theirs"]


@pytest.mark.django_db
def test_overview_reflects_attempts_in_last_7_days(auth_client):
    from apps.exercises.models import Attempt, ExerciseTemplate
    from apps.sessions.models import Session
    from apps.students.models import Student

    student_id = auth_client.post(
        "/api/students/", {"display_name": "Eva", "grade": "P1"}, format="json"
    ).json()["id"]
    student = Student.objects.get(id=student_id)

    session = Session.objects.create(student=student, mode="training")
    template = ExerciseTemplate.objects.first()
    Attempt.objects.create(
        session=session,
        template=template,
        exercise_params={},
        student_answer="1",
        correct_answer="1",
        is_correct=True,
    )
    Attempt.objects.create(
        session=session,
        template=template,
        exercise_params={},
        student_answer="2",
        correct_answer="3",
        is_correct=False,
    )

    res = auth_client.get("/api/parent/overview/")
    s = res.json()["students"][0]
    week = s["last_7_days"]
    assert week["attempts"] == 2
    assert week["accuracy"] == 0.5
    assert week["sessions"] == 1

    today = week["by_day"][-1]
    assert today["attempts"] == 2
    assert today["accuracy"] == 0.5


@pytest.mark.django_db
def test_overview_ignores_attempts_older_than_7_days(auth_client):
    from apps.exercises.models import Attempt, ExerciseTemplate
    from apps.sessions.models import Session
    from apps.students.models import Student

    student_id = auth_client.post(
        "/api/students/", {"display_name": "Old", "grade": "P1"}, format="json"
    ).json()["id"]
    student = Student.objects.get(id=student_id)

    session = Session.objects.create(student=student, mode="training")
    template = ExerciseTemplate.objects.first()
    old = Attempt.objects.create(
        session=session,
        template=template,
        exercise_params={},
        student_answer="1",
        correct_answer="1",
        is_correct=True,
    )
    Attempt.objects.filter(pk=old.pk).update(responded_at=timezone.now() - timedelta(days=30))

    res = auth_client.get("/api/parent/overview/")
    week = res.json()["students"][0]["last_7_days"]
    assert week["attempts"] == 0
