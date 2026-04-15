import pytest
from django.core import signing

from apps.exercises.models import ExerciseTemplate
from apps.exercises.services import ANSWER_SALT, generate_exercise
from apps.sessions.models import Session
from apps.students.models import Student


def _answer(signature: str) -> str:
    payload = signing.loads(signature, salt=ANSWER_SALT)
    return str(payload["answer"])


@pytest.mark.django_db
def test_gamification_payload_on_correct_attempt(auth_client, user):
    student = Student.objects.create(user=user, display_name="A", grade="P1")
    template = ExerciseTemplate.objects.filter(skill__grade="P1").first()
    assert template is not None

    session = Session.objects.create(student=student, mode="learn")
    ex = generate_exercise(template.skill_id, template.difficulty)
    res = auth_client.post(
        f"/api/sessions/{session.id}/attempts/",
        {"signature": ex["signature"], "student_answer": _answer(ex["signature"])},
        format="json",
    )
    assert res.status_code == 201
    body = res.json()
    assert "gamification" in body
    g = body["gamification"]
    assert g["xp_delta"] > 0
    assert g["xp_total"] == g["xp_delta"]
    assert g["rank"] == "curieux"
    assert g["current_streak"] == 1
    assert g["daily_progress"] == 1
    assert any(b["code"] == "first_step" for b in g["newly_earned_badges"])
    assert any(b["code"] == "first_correct" for b in g["newly_earned_badges"])


@pytest.mark.django_db
def test_student_serializer_exposes_gamification(auth_client, user):
    Student.objects.create(user=user, display_name="A", grade="P1", xp=150, rank="calculateur")
    res = auth_client.get("/api/auth/user/")
    assert res.status_code == 200
    children = res.json()["children"]
    assert len(children) == 1
    child = children[0]
    for field in (
        "xp",
        "rank",
        "current_streak",
        "best_streak",
        "daily_goal",
        "daily_progress",
        "achievements",
    ):
        assert field in child
    assert child["xp"] == 150
    assert child["rank"] == "calculateur"
