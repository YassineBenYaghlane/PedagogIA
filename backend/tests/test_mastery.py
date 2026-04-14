import pytest

from apps.skills.models import Skill
from apps.students.models import Student, StudentSkillState
from apps.students.services.mastery import (
    IN_PROGRESS,
    MASTERED,
    NEEDS_REVIEW,
    update_mastery,
)


@pytest.fixture
def student(parent):
    return Student.objects.create(parent=parent, display_name="A", grade="P2")


@pytest.fixture
def skill(db):
    return Skill.objects.get(id="add_avec_retenue_20")


@pytest.mark.django_db
def test_first_correct_marks_in_progress(student, skill):
    state = update_mastery(student, skill, True)
    assert state.status == IN_PROGRESS
    assert state.consecutive_correct == 1
    assert state.total_attempts == 1


@pytest.mark.django_db
def test_threshold_consecutive_correct_marks_mastered(student, skill):
    threshold = skill.mastery_threshold
    last = None
    for _ in range(threshold):
        last = update_mastery(student, skill, True)
    assert last.status == MASTERED
    assert last.consecutive_correct == threshold


@pytest.mark.django_db
def test_wrong_after_mastered_triggers_needs_review(student, skill):
    for _ in range(skill.mastery_threshold):
        update_mastery(student, skill, True)
    state = update_mastery(student, skill, False)
    assert state.status == NEEDS_REVIEW
    assert state.consecutive_correct == 0


@pytest.mark.django_db
def test_wrong_resets_consecutive_streak(student, skill):
    update_mastery(student, skill, True)
    update_mastery(student, skill, True)
    state = update_mastery(student, skill, False)
    assert state.consecutive_correct == 0
    assert state.status == IN_PROGRESS


@pytest.mark.django_db
def test_creates_state_if_missing(student, skill):
    assert not StudentSkillState.objects.filter(student=student, skill=skill).exists()
    update_mastery(student, skill, True)
    assert StudentSkillState.objects.filter(student=student, skill=skill).exists()
