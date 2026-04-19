import pytest
from django.utils import timezone

from apps.skills.models import Skill
from apps.students.models import SKILL_XP_MAX, Student, StudentSkillState
from apps.students.services.selection import (
    NoSkillAvailable,
    difficulty_for_xp,
    pick_next_skill,
)


@pytest.fixture
def p1_student(user):
    return Student.objects.create(user=user, display_name="A", grade="P1")


def test_difficulty_for_xp_bands():
    assert difficulty_for_xp(0) == 1
    assert difficulty_for_xp(9.9) == 1
    assert difficulty_for_xp(10) == 2
    assert difficulty_for_xp(19.9) == 2
    assert difficulty_for_xp(20) == 3
    assert difficulty_for_xp(30) == 3


@pytest.mark.django_db
def test_picks_a_p1_skill_for_fresh_student(p1_student):
    skill, difficulty = pick_next_skill(p1_student)
    assert skill.grade == "P1"
    assert difficulty in (1, 2, 3)


@pytest.mark.django_db
def test_skips_mastered_skills(p1_student):
    first, _ = pick_next_skill(p1_student)
    StudentSkillState.objects.create(student=p1_student, skill=first, skill_xp=SKILL_XP_MAX)
    second, _ = pick_next_skill(p1_student)
    assert second.id != first.id


@pytest.mark.django_db
def test_needs_review_takes_priority_over_frontier(p1_student):
    from datetime import timedelta

    from apps.exercises.models import ExerciseTemplate

    skill = Skill.objects.filter(
        grade="P1", id__in=ExerciseTemplate.objects.values("skills")
    ).first()
    assert skill is not None
    stale = timezone.now() - timedelta(days=60)
    StudentSkillState.objects.create(
        student=p1_student,
        skill=skill,
        skill_xp=10.0,
        last_practiced_at=stale,
    )
    picked, _ = pick_next_skill(p1_student)
    assert picked.id == skill.id


@pytest.mark.django_db
def test_difficulty_scales_with_skill_xp(p1_student):
    from datetime import timedelta

    from apps.exercises.models import ExerciseTemplate

    skill = Skill.objects.filter(
        grade="P1", id__in=ExerciseTemplate.objects.values("skills")
    ).first()
    assert skill is not None
    stale = timezone.now() - timedelta(days=60)
    StudentSkillState.objects.create(
        student=p1_student,
        skill=skill,
        skill_xp=15.0,
        last_practiced_at=stale,
    )
    _, diff = pick_next_skill(p1_student)
    assert diff == 2


@pytest.mark.django_db
def test_raises_when_no_skills_for_grade(user):
    student = Student.objects.create(user=user, display_name="X", grade="P9")
    with pytest.raises(NoSkillAvailable):
        pick_next_skill(student)


@pytest.mark.django_db
def test_mastering_advances_selection(p1_student):
    first, _ = pick_next_skill(p1_student)
    StudentSkillState.objects.create(student=p1_student, skill=first, skill_xp=SKILL_XP_MAX)
    second, _ = pick_next_skill(p1_student)
    assert second.id != first.id
