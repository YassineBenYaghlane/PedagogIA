"""Stairs-policy diagnostic tests: climbing, descending, inertia, verdict."""

import json

import pytest
from django.core import signing

from apps.exercises.diagnostic import (
    DIAGNOSTIC_MAX_LENGTH,
    GRADE_ORDER,
    Cursor,
    YearState,
    _fwb_verdict,
    _step_cursor,
    select_next_slot,
)
from apps.exercises.services import ANSWER_SALT


def _reveal_answer(signature: str):
    return signing.loads(signature, salt=ANSWER_SALT)["answer"]


class _FakeSkill:
    def __init__(self, sid, grade):
        self.id = sid
        self.grade = grade


class _FakeAttempt:
    def __init__(self, sid, grade, difficulty, is_correct):
        self.skill = _FakeSkill(sid, grade)
        self.skill_id = sid
        self.is_correct = is_correct
        self.template_id = True
        self.template = type("_T", (), {"difficulty": difficulty})()


def _bump(state: YearState, sid: str, difficulty: int, ok: bool) -> None:
    from apps.exercises.diagnostic import _bump_state

    _bump_state(state, sid, difficulty, ok)


def test_correct_answer_stays_until_enough_breadth():
    cursor = Cursor("P3", 1)
    states = {g: YearState(grade=g) for g in GRADE_ORDER}
    s = states["P3"]

    # One correct, 1 category covered → must stay (not enough breadth)
    _bump(s, "num_compter_39", 1, True)
    attempts = [_FakeAttempt("num_compter_39", "P3", 1, True)]
    nxt = _step_cursor(cursor, states, attempts, up_to=1)
    assert (nxt.grade, nxt.difficulty) == ("P3", 1)

    # Two corrects in different categories → now we can promote
    _bump(s, "add_complements_10", 1, True)
    attempts.append(_FakeAttempt("add_complements_10", "P3", 1, True))
    nxt = _step_cursor(cursor, states, attempts, up_to=2)
    assert (nxt.grade, nxt.difficulty) == ("P3", 2)


def test_correct_at_difficulty_3_climbs_to_next_year():
    cursor = Cursor("P3", 3)
    states = {g: YearState(grade=g) for g in GRADE_ORDER}
    s = states["P3"]
    # Give breadth
    _bump(s, "num_x", 3, True)
    _bump(s, "add_y", 3, True)
    attempts = [
        _FakeAttempt("num_x", "P3", 3, True),
        _FakeAttempt("add_y", "P3", 3, True),
    ]
    nxt = _step_cursor(cursor, states, attempts, up_to=2)
    assert (nxt.grade, nxt.difficulty) == ("P4", 1)


def test_wrong_answer_with_inertia_stays_once():
    cursor = Cursor("P3", 2)
    states = {g: YearState(grade=g) for g in GRADE_ORDER}
    s = states["P3"]
    # Two previous correct answers at P3, then one wrong → single miss, stay
    _bump(s, "num_a", 2, True)
    _bump(s, "add_b", 2, True)
    _bump(s, "soustr_c", 2, False)
    attempts = [
        _FakeAttempt("num_a", "P3", 2, True),
        _FakeAttempt("add_b", "P3", 2, True),
        _FakeAttempt("soustr_c", "P3", 2, False),
    ]
    nxt = _step_cursor(cursor, states, attempts, up_to=3)
    assert (nxt.grade, nxt.difficulty) == ("P3", 2)


def test_two_wrongs_descend_difficulty():
    cursor = Cursor("P3", 2)
    states = {g: YearState(grade=g) for g in GRADE_ORDER}
    s = states["P3"]
    _bump(s, "num_a", 2, False)
    _bump(s, "add_b", 2, False)
    attempts = [
        _FakeAttempt("num_a", "P3", 2, False),
        _FakeAttempt("add_b", "P3", 2, False),
    ]
    nxt = _step_cursor(cursor, states, attempts, up_to=2)
    assert (nxt.grade, nxt.difficulty) == ("P3", 1)


def test_wrong_at_difficulty_1_drops_a_year():
    cursor = Cursor("P3", 1)
    states = {g: YearState(grade=g) for g in GRADE_ORDER}
    _bump(states["P3"], "num_a", 1, False)
    attempts = [_FakeAttempt("num_a", "P3", 1, False)]
    nxt = _step_cursor(cursor, states, attempts, up_to=1)
    assert (nxt.grade, nxt.difficulty) == ("P2", 3)


def test_verdict_highest_year_at_difficulty_2plus():
    states = {g: YearState(grade=g) for g in GRADE_ORDER}
    # P3 mastered at d=2; P4 good at d=1 only — must not count
    _bump(states["P3"], "num_a", 2, True)
    _bump(states["P3"], "add_b", 2, True)
    _bump(states["P3"], "soustr_c", 3, True)
    for sid in ("num_x", "add_y", "soustr_z"):
        _bump(states["P4"], sid, 1, True)

    from types import SimpleNamespace

    student = SimpleNamespace(grade="P3")
    verdict = _fwb_verdict(student, states, [])
    assert verdict["level"] == "P3"


def test_verdict_null_with_no_data():
    states = {g: YearState(grade=g) for g in GRADE_ORDER}
    from types import SimpleNamespace

    student = SimpleNamespace(grade="P3")
    verdict = _fwb_verdict(student, states, [])
    assert verdict["level"] is None


@pytest.mark.django_db
def test_perfect_play_climbs_not_drops(auth_client):
    """A P4 student answering everything right must never be asked P1/P2 questions."""
    res = auth_client.post(
        "/api/students/", {"display_name": "Ace", "grade": "P4"}, format="json"
    ).json()
    session_id = auth_client.post(
        "/api/diagnostic/start/", {"student_id": res["id"]}, format="json"
    ).json()["session_id"]

    seen_grades = []
    first = auth_client.get(f"/api/diagnostic/{session_id}/next/").json()
    if not first["done"]:
        seen_grades.append(first["question"]["exercise"]["skill_id"])

    for _ in range(DIAGNOSTIC_MAX_LENGTH + 2):
        nxt = auth_client.get(f"/api/diagnostic/{session_id}/next/").json()
        if nxt["done"]:
            break
        q = nxt["question"]
        ex = q["exercise"]
        answer = _reveal_answer(ex["signature"])
        student_answer = json.dumps(answer) if isinstance(answer, (list, dict)) else str(answer)
        auth_client.post(
            f"/api/sessions/{session_id}/attempts/",
            {"signature": ex["signature"], "student_answer": student_answer},
            format="json",
        )

    result = auth_client.get(f"/api/diagnostic/{session_id}/result/").json()
    # Every year touched must be P4 or higher — never P1/P2/P3.
    touched = [y["grade"] for y in result["years"]]
    assert touched, "at least one year should be populated"
    assert all(GRADE_ORDER.index(g) >= GRADE_ORDER.index("P4") for g in touched), (
        f"Perfect P4 play should never drop below P4, got {touched}"
    )
    assert result["verdict"]["level"] in {"P4", "P5", "P6"}


@pytest.mark.django_db
def test_wrong_play_descends(auth_client):
    """A P4 student answering nothing right ends up below P4."""
    res = auth_client.post(
        "/api/students/", {"display_name": "Floor", "grade": "P4"}, format="json"
    ).json()
    session_id = auth_client.post(
        "/api/diagnostic/start/", {"student_id": res["id"]}, format="json"
    ).json()["session_id"]

    for _ in range(DIAGNOSTIC_MAX_LENGTH):
        nxt = auth_client.get(f"/api/diagnostic/{session_id}/next/").json()
        if nxt["done"]:
            break
        q = nxt["question"]
        auth_client.post(
            f"/api/sessions/{session_id}/attempts/",
            {
                "signature": q["exercise"]["signature"],
                "student_answer": "definitely-wrong-999",
            },
            format="json",
        )

    result = auth_client.get(f"/api/diagnostic/{session_id}/result/").json()
    touched = [y["grade"] for y in result["years"]]
    # Student should have been pushed to P3 or below before floor termination
    assert any(GRADE_ORDER.index(g) <= GRADE_ORDER.index("P3") for g in touched)
    verdict = result["verdict"]["level"]
    assert verdict is None or GRADE_ORDER.index(verdict) <= GRADE_ORDER.index("P4")


@pytest.mark.django_db
def test_max_length_cap(auth_client):
    res = auth_client.post("/api/students/", {"display_name": "Cap", "grade": "P3"}, format="json")
    from apps.students.models import Student

    student = Student.objects.get(id=res.json()["id"])
    attempts = [
        _FakeAttempt("num_compter_39", "P1", 1, False) for _ in range(DIAGNOSTIC_MAX_LENGTH)
    ]
    assert select_next_slot(student, attempts) is None
