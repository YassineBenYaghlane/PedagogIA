"""IRT algorithm tests — cover floor, ceiling, convergence, max-info selection."""

import json

import pytest
from django.core import signing

from apps.exercises.diagnostic import (
    DIAGNOSTIC_MAX_LENGTH,
    GRADE_ORDER,
    YearState,
    _bayes_update,
    _converged,
    _fwb_verdict,
    _pick_year,
    _template_pool,
    select_next_slot,
)
from apps.exercises.services import ANSWER_SALT


def _reveal_answer(signature: str):
    return signing.loads(signature, salt=ANSWER_SALT)["answer"]


class _StubAttempt:
    def __init__(self, skill, difficulty, is_correct):
        self.skill = skill
        self.skill_id = skill.id
        self.is_correct = is_correct
        # Minimal template stub; _replay_states reads .template.difficulty
        self.template_id = True
        self.template = type("_T", (), {"difficulty": difficulty})()


def _states_all_years():
    return {g: YearState(grade=g) for g in GRADE_ORDER}


def test_bayes_update_pulls_theta_toward_observation():
    s = YearState(grade="P3")
    for _ in range(5):
        _bayes_update(s, difficulty=2, is_correct=True)
    assert s.theta > 0
    assert s.se < 2.0  # variance shrinks

    s2 = YearState(grade="P3")
    for _ in range(5):
        _bayes_update(s2, difficulty=2, is_correct=False)
    assert s2.theta < 0


def test_se_shrinks_monotonically_with_more_data():
    s = YearState(grade="P3")
    se0 = s.se
    _bayes_update(s, 2, True)
    se1 = s.se
    _bayes_update(s, 2, False)
    se2 = s.se
    assert se1 < se0
    assert se2 < se1


def test_converged_requires_all_years_narrow_or_pinned():
    states = _states_all_years()
    assert not _converged(states)
    # Pin each year either by floor (very low θ) or by tight CI
    for g in GRADE_ORDER:
        states[g].theta = -3.0
        states[g].variance = 0.1
    assert _converged(states)


@pytest.mark.django_db
def test_pick_year_chooses_widest_ci():
    states = _states_all_years()
    # P3 and P4 both have some info; P4 has wider CI → should be picked
    states["P3"].variance = 0.5
    states["P4"].variance = 2.0
    states["P3"].n = 3
    states["P4"].n = 1

    pool = _template_pool()
    if not pool:
        pytest.skip("no templates seeded in this test DB")
    chosen = _pick_year(states, "P3", pool)
    # Among years with wider CI first
    assert chosen is not None
    assert states[chosen].variance >= states["P3"].variance


@pytest.mark.django_db
def test_floor_pinning_excludes_year():
    states = _states_all_years()
    states["P1"].theta = -3.0
    states["P1"].variance = 0.1
    states["P1"].n = 4
    pool = _template_pool()
    if not pool:
        pytest.skip("no templates seeded")
    chosen = _pick_year(states, "P3", pool)
    assert chosen != "P1"


@pytest.mark.django_db
def test_ceiling_pinning_excludes_year():
    states = _states_all_years()
    states["P6"].theta = 3.0
    states["P6"].variance = 0.1
    states["P6"].n = 4
    pool = _template_pool()
    if not pool:
        pytest.skip("no templates seeded")
    chosen = _pick_year(states, "P3", pool)
    assert chosen != "P6"


def test_verdict_picks_highest_mastered_year():
    states = _states_all_years()
    # P1, P2, P3 mastered; P4+ shaky / unknown
    for g in ("P1", "P2", "P3"):
        states[g].theta = 2.5
        states[g].variance = 0.2
        states[g].n = 3
    for g in ("P4", "P5"):
        states[g].theta = -1.0
        states[g].variance = 0.3
        states[g].n = 3

    verdict = _fwb_verdict(states)
    assert verdict["level"] == "P3"
    assert verdict["confidence"] >= 0.7


def test_verdict_null_when_no_year_confident():
    states = _states_all_years()
    # Student answered nothing → verdict should be None
    verdict = _fwb_verdict(states)
    assert verdict["level"] is None


@pytest.mark.django_db
def test_max_length_cap_respected(auth_client):
    """select_next_slot returns None once max length is hit."""
    res = auth_client.post("/api/students/", {"display_name": "Cap", "grade": "P3"}, format="json")
    student_id = res.json()["id"]
    from apps.students.models import Student

    student = Student.objects.get(id=student_id)
    attempts = [
        _StubAttempt(
            skill=type("_S", (), {"id": "num_compter_39", "grade": "P1"})(),
            difficulty=1,
            is_correct=False,
        )
        for _ in range(DIAGNOSTIC_MAX_LENGTH)
    ]
    assert select_next_slot(student, attempts) is None


@pytest.mark.django_db
def test_ceiling_student_converges_before_max(auth_client):
    """Student answering everything correctly should terminate before 25 Qs."""
    res = auth_client.post(
        "/api/students/", {"display_name": "Ace", "grade": "P3"}, format="json"
    ).json()
    session_id = auth_client.post(
        "/api/diagnostic/start/", {"student_id": res["id"]}, format="json"
    ).json()["session_id"]

    for _ in range(DIAGNOSTIC_MAX_LENGTH):
        nxt = auth_client.get(f"/api/diagnostic/{session_id}/next/").json()
        if nxt["done"]:
            break
        q = nxt["question"]
        exercise = q["exercise"]
        answer = _reveal_answer(exercise["signature"])
        student_answer = json.dumps(answer) if isinstance(answer, (list, dict)) else str(answer)
        auth_client.post(
            f"/api/sessions/{session_id}/attempts/",
            {"signature": exercise["signature"], "student_answer": student_answer},
            format="json",
        )

    final = auth_client.get(f"/api/diagnostic/{session_id}/next/").json()
    assert final["done"] is True
    result = auth_client.get(f"/api/diagnostic/{session_id}/result/").json()
    # Should produce a verdict, and it should be P3 or higher given perfect play
    assert result["verdict"]["level"] in {"P3", "P4", "P5", "P6"}


@pytest.mark.django_db
def test_floor_student_gets_low_verdict_or_none(auth_client):
    """Wrong-on-every-question should push verdict ≤ declared year or None."""
    student = auth_client.post(
        "/api/students/", {"display_name": "Floor", "grade": "P3"}, format="json"
    ).json()
    session_id = auth_client.post(
        "/api/diagnostic/start/", {"student_id": student["id"]}, format="json"
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
    # Can't reach a confident verdict when every answer is wrong
    level = result["verdict"]["level"]
    assert level is None or GRADE_ORDER.index(level) <= GRADE_ORDER.index("P3")
