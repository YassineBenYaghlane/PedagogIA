import pytest

from apps.students.models import Student, StudentAchievement
from apps.students.services import achievements


@pytest.fixture
def student(user):
    return Student.objects.create(user=user, display_name="A", grade="P3")


@pytest.mark.django_db
def test_first_step_awarded_once(student):
    ctx = {
        "is_correct": True,
        "difficulty": 1,
        "session_consecutive_correct": 1,
        "new_rank": None,
        "daily_progress": 0,
    }
    # First evaluation with 0 attempts should NOT award (counts use DB — requires an attempt).
    # So we simulate: create no attempts → no badge. Here we test idempotency by pre-seeding.
    StudentAchievement.objects.create(student=student, code="first_step")
    new = achievements.evaluate(student, ctx)
    codes = [a.code for a in new]
    assert "first_step" not in codes


@pytest.mark.django_db
def test_streak_day_7_triggers(student):
    student.current_streak = 7
    student.save()
    ctx = {
        "is_correct": True,
        "difficulty": 1,
        "session_consecutive_correct": 1,
        "new_rank": None,
        "daily_progress": 0,
    }
    new = achievements.evaluate(student, ctx)
    codes = {a.code for a in new}
    assert "streak_day_3" in codes
    assert "streak_day_7" in codes
    assert "streak_day_30" not in codes


@pytest.mark.django_db
def test_rank_badge_on_threshold(student):
    ctx = {
        "is_correct": True,
        "difficulty": 2,
        "session_consecutive_correct": 1,
        "new_rank": "calculateur",
        "daily_progress": 0,
    }
    new = achievements.evaluate(student, ctx)
    codes = {a.code for a in new}
    assert "rank_calculateur" in codes


@pytest.mark.django_db
def test_daily_goal_hit_idempotent(student):
    student.daily_goal = 5
    student.save()
    ctx = {
        "is_correct": True,
        "difficulty": 1,
        "session_consecutive_correct": 1,
        "new_rank": None,
        "daily_progress": 5,
    }
    first = achievements.evaluate(student, ctx)
    codes = {a.code for a in first}
    assert "daily_goal_hit" in codes

    # Second evaluation on same day must not re-award.
    second = achievements.evaluate(student, ctx)
    codes2 = {a.code for a in second}
    assert "daily_goal_hit" not in codes2


@pytest.mark.django_db
def test_session_consecutive_correct_triggers(student):
    ctx = {
        "is_correct": True,
        "difficulty": 1,
        "session_consecutive_correct": 10,
        "new_rank": None,
        "daily_progress": 0,
    }
    new = achievements.evaluate(student, ctx)
    codes = {a.code for a in new}
    assert "streak_3_row" in codes
    assert "streak_10_row" in codes
