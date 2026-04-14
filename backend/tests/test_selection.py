import pytest

from apps.skills.models import Skill
from apps.students.models import Student, StudentSkillState
from apps.students.services.mastery import MASTERED, NEEDS_REVIEW, update_mastery
from apps.students.services.selection import NoSkillAvailable, pick_next_skill


@pytest.fixture
def p1_student(parent):
    return Student.objects.create(parent=parent, display_name="A", grade="P1")


@pytest.mark.django_db
def test_picks_a_p1_skill_for_fresh_student(p1_student):
    skill, difficulty = pick_next_skill(p1_student)
    assert skill.grade == "P1"
    assert difficulty in (1, 2, 3)


@pytest.mark.django_db
def test_skips_mastered_skills(p1_student):
    first, _ = pick_next_skill(p1_student)
    StudentSkillState.objects.create(student=p1_student, skill=first, status=MASTERED)
    second, _ = pick_next_skill(p1_student)
    assert second.id != first.id


@pytest.mark.django_db
def test_needs_review_takes_priority_over_frontier(p1_student):
    skill = Skill.objects.filter(grade="P1").first()
    StudentSkillState.objects.create(
        student=p1_student, skill=skill, status=NEEDS_REVIEW, mastery_level=0.8
    )
    picked, _ = pick_next_skill(p1_student)
    assert picked.id == skill.id


@pytest.mark.django_db
def test_difficulty_scales_with_mastery_level(p1_student):
    skill = Skill.objects.filter(grade="P1").first()
    StudentSkillState.objects.create(
        student=p1_student, skill=skill, status=NEEDS_REVIEW, mastery_level=0.8
    )
    _, diff = pick_next_skill(p1_student)
    assert diff == 3


@pytest.mark.django_db
def test_raises_when_no_skills_for_grade(parent):
    student = Student.objects.create(parent=parent, display_name="X", grade="P9")
    with pytest.raises(NoSkillAvailable):
        pick_next_skill(student)


@pytest.mark.django_db
def test_correct_streak_then_selection_advances(p1_student):
    first, _ = pick_next_skill(p1_student)
    for _ in range(first.mastery_threshold):
        update_mastery(p1_student, first, True)
    second, _ = pick_next_skill(p1_student)
    assert second.id != first.id
