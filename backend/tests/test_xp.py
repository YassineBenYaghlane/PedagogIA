import pytest

from apps.students.models import Student
from apps.students.services.xp import award_xp, rank_for_xp, xp_for_answer


@pytest.fixture
def student(user):
    return Student.objects.create(user=user, display_name="A", grade="P3")


def test_xp_for_answer_base_and_difficulty():
    assert xp_for_answer(True, 1, 0) == 10
    assert xp_for_answer(True, 2, 0) == 15
    assert xp_for_answer(True, 3, 0) == 20
    assert xp_for_answer(False, 3, 10) == 0


def test_xp_for_answer_streak_bonus():
    assert xp_for_answer(True, 1, 2) == 10
    assert xp_for_answer(True, 1, 3) == 12
    assert xp_for_answer(True, 1, 5) == 15
    assert xp_for_answer(True, 1, 10) == 20


def test_rank_for_xp_thresholds():
    assert rank_for_xp(0) == "curieux"
    assert rank_for_xp(99) == "curieux"
    assert rank_for_xp(100) == "calculateur"
    assert rank_for_xp(299) == "calculateur"
    assert rank_for_xp(300) == "arithmeticien"
    assert rank_for_xp(700) == "mathematicien"
    assert rank_for_xp(1500) == "savant"
    assert rank_for_xp(100000) == "savant"


@pytest.mark.django_db
def test_award_xp_transition_changes_rank(student):
    student.xp = 95
    student.rank = "curieux"
    student.save()
    delta, new_rank = award_xp(student, True, 1, 0)
    assert delta == 10
    assert new_rank == "calculateur"
    student.refresh_from_db()
    assert student.xp == 105
    assert student.rank == "calculateur"


@pytest.mark.django_db
def test_award_xp_no_rank_change(student):
    student.xp = 50
    student.save()
    delta, new_rank = award_xp(student, True, 2, 0)
    assert delta == 15
    assert new_rank is None
    student.refresh_from_db()
    assert student.xp == 65
    assert student.rank == "curieux"


@pytest.mark.django_db
def test_award_xp_wrong_answer_noop(student):
    delta, new_rank = award_xp(student, False, 3, 5)
    assert delta == 0
    assert new_rank is None
    student.refresh_from_db()
    assert student.xp == 0
