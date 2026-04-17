"""IRT-style adaptive diagnostic across P1..P6.

Per-year Rasch ability θ_y ∈ ℝ and posterior variance σ_y² are tracked as the
student answers. Questions target the year with the widest confidence interval
(max-information sampling). The test terminates on CI convergence, floor or
ceiling detection, or at `DIAGNOSTIC_MAX_LENGTH` questions.

The final verdict is the highest year whose posterior mastery probability is
≥ VERDICT_MASTERY_THRESHOLD with sufficient confidence.
"""

import math
from collections import defaultdict
from dataclasses import dataclass, field

from apps.skills.models import Skill
from apps.students.models import Student, StudentSkillState

from .models import Attempt, ExerciseTemplate
from .services import generate_exercise

DIAGNOSTIC_MAX_LENGTH = 25
DIAGNOSTIC_MIN_LENGTH = 8

# Legacy name kept for callers that still want an estimate of "expected length"
DIAGNOSTIC_LENGTH = DIAGNOSTIC_MAX_LENGTH

CATEGORIES = [
    ("num", "Numération"),
    ("add", "Addition"),
    ("soustr", "Soustraction"),
    ("mult", "Multiplication"),
    ("div", "Division"),
    ("cm", "Calcul mental"),
]

GRADE_ORDER = ["P1", "P2", "P3", "P4", "P5", "P6"]

# Rasch IRT parameters
PRIOR_MEAN = 0.0
PRIOR_VAR = 4.0  # σ₀² — broad prior so early answers shift θ meaningfully
DIFFICULTY_STEP = 0.7  # b = (difficulty - 2) * step

# Convergence / stop thresholds (on σ_y, not σ_y²)
SE_CONVERGED = 0.55  # stop probing a year when SE drops below this
FLOOR_ABILITY = -1.5  # θ below this with tight CI → "not this year"
CEILING_ABILITY = 1.5  # θ above this with tight CI → "fully handled"

# Bucket + verdict thresholds
GREEN_THRESHOLD = 0.8
RED_THRESHOLD = 0.4
VERDICT_MASTERY_THRESHOLD = 0.7
# The test runs ~4 answers per year → σ≈1.0. Require a bit tighter than that
# but don't demand impossible precision given a 25-question budget.
VERDICT_CONFIDENCE_SE = 1.2


@dataclass
class Slot:
    skill_id: str
    difficulty: int


@dataclass
class YearState:
    grade: str
    n: int = 0
    correct: int = 0
    theta: float = PRIOR_MEAN
    variance: float = PRIOR_VAR
    covered_skills: set[str] = field(default_factory=set)

    @property
    def se(self) -> float:
        return math.sqrt(self.variance)

    @property
    def mastery(self) -> float:
        return _sigmoid(self.theta)

    def ci(self, z: float = 1.96) -> tuple[float, float]:
        lo = _sigmoid(self.theta - z * self.se)
        hi = _sigmoid(self.theta + z * self.se)
        return lo, hi


def _sigmoid(x: float) -> float:
    if x >= 0:
        ex = math.exp(-x)
        return 1.0 / (1.0 + ex)
    ex = math.exp(x)
    return ex / (1.0 + ex)


def _category_of(skill_id: str) -> str | None:
    prefix = skill_id.split("_", 1)[0]
    for cat, _ in CATEGORIES:
        if prefix == cat:
            return cat
    return None


def _difficulty_to_b(difficulty: int) -> float:
    return (difficulty - 2) * DIFFICULTY_STEP


def _bayes_update(state: YearState, difficulty: int, is_correct: bool) -> None:
    """Laplace-approximation update of θ_y given one Rasch response."""
    b = _difficulty_to_b(difficulty)
    p = _sigmoid(state.theta - b)
    info = p * (1.0 - p)
    obs = 1.0 if is_correct else 0.0
    prior_precision = 1.0 / state.variance
    posterior_precision = prior_precision + info
    state.variance = 1.0 / posterior_precision
    state.theta = state.theta + state.variance * (obs - p)
    state.n += 1
    if is_correct:
        state.correct += 1


def _template_pool() -> dict[str, dict[int, list[str]]]:
    """{grade: {difficulty: [skill_id, ...]}} for skills with templates."""
    pool: dict[str, dict[int, list[str]]] = defaultdict(lambda: defaultdict(list))
    rows = ExerciseTemplate.objects.select_related("skill").values(
        "skill_id", "skill__grade", "difficulty"
    )
    seen: set[tuple[str, int]] = set()
    for row in rows:
        key = (row["skill_id"], row["difficulty"])
        if key in seen:
            continue
        seen.add(key)
        pool[row["skill__grade"]][row["difficulty"]].append(row["skill_id"])
    return pool


def _replay_states(attempts: list[Attempt]) -> dict[str, YearState]:
    """Rebuild per-year states from stored attempts."""
    states: dict[str, YearState] = {g: YearState(grade=g) for g in GRADE_ORDER}
    for a in attempts:
        grade = getattr(a.skill, "grade", None)
        if grade not in states:
            continue
        difficulty = a.template.difficulty if a.template_id else 2
        _bayes_update(states[grade], difficulty, a.is_correct)
        states[grade].covered_skills.add(a.skill_id)
    return states


def _floor_reached(states: dict[str, YearState]) -> bool:
    s = states["P1"]
    return s.n >= 3 and s.theta <= FLOOR_ABILITY and s.se < SE_CONVERGED


def _ceiling_reached(states: dict[str, YearState]) -> bool:
    s = states["P6"]
    return s.n >= 3 and s.theta >= CEILING_ABILITY and s.se < SE_CONVERGED


def _converged(states: dict[str, YearState]) -> bool:
    """Done when every year the student might still be placed in is narrow."""
    return all(
        s.se < SE_CONVERGED or s.theta <= FLOOR_ABILITY or s.theta >= CEILING_ABILITY
        for s in states.values()
    )


def _pick_year(
    states: dict[str, YearState],
    student_grade: str,
    pool: dict[str, dict[int, list[str]]],
) -> str | None:
    """Year with the widest CI that still has askable templates and isn't pinned."""
    candidates: list[tuple[float, int, str]] = []
    student_idx = GRADE_ORDER.index(student_grade) if student_grade in GRADE_ORDER else 2
    for grade in GRADE_ORDER:
        s = states[grade]
        if not pool.get(grade):
            continue
        if s.theta <= FLOOR_ABILITY and s.se < SE_CONVERGED:
            continue
        if s.theta >= CEILING_ABILITY and s.se < SE_CONVERGED:
            continue
        # Tie-break: distance from student's declared grade (prefer closer first)
        year_idx = GRADE_ORDER.index(grade)
        candidates.append((-s.se, abs(year_idx - student_idx), grade))
    if not candidates:
        return None
    candidates.sort()
    return candidates[0][2]


def _pick_difficulty(state: YearState) -> int:
    """Difficulty whose b is closest to θ_y."""
    best: tuple[float, int] | None = None
    for d in (1, 2, 3):
        gap = abs(_difficulty_to_b(d) - state.theta)
        if best is None or gap < best[0]:
            best = (gap, d)
    assert best is not None
    return best[1]


def _pick_skill(
    pool: dict[str, dict[int, list[str]]],
    grade: str,
    preferred_difficulty: int,
    state: YearState,
    global_covered: set[str],
) -> tuple[str, int] | None:
    """Pick (skill_id, difficulty) for the chosen year, rotating categories."""
    year_pool = pool.get(grade, {})
    if not year_pool:
        return None

    difficulty_order = sorted(year_pool.keys(), key=lambda d: abs(d - preferred_difficulty))
    # Category counts so far in this year — least-covered first
    cat_counts: dict[str, int] = defaultdict(int)
    for sid in state.covered_skills:
        cat = _category_of(sid)
        if cat is not None:
            cat_counts[cat] += 1

    def rank(sid: str) -> tuple[int, int, str]:
        cat = _category_of(sid) or "zz"
        already_covered_year = sid in state.covered_skills
        already_covered_global = sid in global_covered
        return (
            int(already_covered_year) * 2 + int(already_covered_global),
            cat_counts[cat],
            sid,
        )

    for d in difficulty_order:
        skills = sorted(year_pool[d], key=rank)
        if skills:
            return skills[0], d
    return None


def select_next_slot(student: Student, attempts: list[Attempt]) -> Slot | None:
    """IRT max-information next-question selection."""
    if len(attempts) >= DIAGNOSTIC_MAX_LENGTH:
        return None

    states = _replay_states(attempts)
    if len(attempts) >= DIAGNOSTIC_MIN_LENGTH and _converged(states):
        return None

    pool = _template_pool()
    if not pool:
        return None

    year = _pick_year(states, student.grade, pool)
    if year is None:
        return None

    state = states[year]
    preferred = _pick_difficulty(state)
    global_covered = {a.skill_id for a in attempts}
    picked = _pick_skill(pool, year, preferred, state, global_covered)
    if picked is None:
        return None
    skill_id, difficulty = picked
    return Slot(skill_id=skill_id, difficulty=difficulty)


def get_exercise_for_slot(slot: Slot) -> dict:
    return generate_exercise(slot.skill_id, slot.difficulty)


def _bucket(rate: float) -> str:
    if rate >= GREEN_THRESHOLD:
        return "green"
    if rate < RED_THRESHOLD:
        return "red"
    return "orange"


def _fwb_verdict(states: dict[str, YearState]) -> dict:
    """Highest year whose mastery prob is ≥ threshold with tight CI."""
    best: str | None = None
    best_mastery = 0.0
    for grade in GRADE_ORDER:
        s = states[grade]
        if s.n == 0:
            continue
        if s.mastery >= VERDICT_MASTERY_THRESHOLD and s.se <= VERDICT_CONFIDENCE_SE:
            best = grade
            best_mastery = s.mastery
    if best is None:
        return {
            "level": None,
            "confidence": 0.0,
            "narrative": (
                "Données insuffisantes pour estimer un niveau FWB. "
                "Refaites le diagnostic pour affiner."
            ),
        }
    narrative = _verdict_narrative(best, states)
    return {
        "level": best,
        "confidence": round(best_mastery, 2),
        "narrative": narrative,
    }


def _verdict_narrative(level: str, states: dict[str, YearState]) -> str:
    mastered = [g for g in GRADE_ORDER if states[g].n and states[g].mastery >= 0.7]
    shaky = [g for g in GRADE_ORDER if states[g].n and 0.4 <= states[g].mastery < 0.7]
    parts = [f"Niveau FWB estimé : {level}."]
    if mastered:
        parts.append(f"Solide sur {', '.join(mastered)}.")
    if shaky:
        parts.append(f"Encore fragile sur {', '.join(shaky)}.")
    return " ".join(parts)


def build_result(session) -> dict:
    """Aggregate diagnostic attempts into per-skill + per-year + verdict."""
    attempts = list(
        Attempt.objects.filter(session=session)
        .select_related("skill", "template")
        .order_by("responded_at")
    )

    states = _replay_states(attempts)

    by_skill: dict[str, list[Attempt]] = defaultdict(list)
    for a in attempts:
        by_skill[a.skill_id].append(a)

    skill_ids = list(by_skill.keys())
    skills = {s.id: s for s in Skill.objects.filter(id__in=skill_ids)}

    state_map = {}
    if skill_ids:
        rows = StudentSkillState.objects.filter(student=session.student, skill_id__in=skill_ids)
        state_map = {s.skill_id: s for s in rows}

    skills_result = []
    for skill_id, items in by_skill.items():
        skill = skills.get(skill_id)
        if skill is None:
            continue
        correct = sum(1 for a in items if a.is_correct)
        total = len(items)
        rate = correct / total if total else 0.0
        sstate = state_map.get(skill_id)
        skills_result.append(
            {
                "skill_id": skill_id,
                "label": skill.label,
                "grade": skill.grade,
                "category": _category_of(skill_id),
                "total": total,
                "correct": correct,
                "rate": round(rate, 2),
                "bucket": _bucket(rate),
                "mastery_level": round(sstate.mastery_level, 2) if sstate else 0.0,
            }
        )
    skills_result.sort(key=lambda r: (r["grade"], r["skill_id"]))

    grades = _grade_summary(skills_result)
    years = _year_summary(states)
    verdict = _fwb_verdict(states)

    strengths = [s for s in skills_result if s["bucket"] == "green"]
    weaknesses = [s for s in skills_result if s["bucket"] == "red"]

    total_attempts = len(attempts)
    total_correct = sum(1 for a in attempts if a.is_correct)

    return {
        "session_id": str(session.id),
        "student_id": str(session.student_id),
        "ended_at": session.ended_at.isoformat() if session.ended_at else None,
        "total_attempts": total_attempts,
        "total_correct": total_correct,
        "overall_rate": round(total_correct / total_attempts, 2) if total_attempts else 0.0,
        "skills": skills_result,
        "grades": grades,
        "years": years,
        "verdict": verdict,
        "strengths": [{"skill_id": s["skill_id"], "label": s["label"]} for s in strengths[:5]],
        "weaknesses": [{"skill_id": s["skill_id"], "label": s["label"]} for s in weaknesses[:5]],
    }


def _year_summary(states: dict[str, YearState]) -> list[dict]:
    out = []
    for grade in GRADE_ORDER:
        s = states[grade]
        if s.n == 0:
            continue
        lo, hi = s.ci()
        out.append(
            {
                "grade": grade,
                "n": s.n,
                "correct": s.correct,
                "mastery_pct": round(s.mastery * 100),
                "ci_lo": round(lo * 100),
                "ci_hi": round(hi * 100),
                "se": round(s.se, 2),
                "bucket": _bucket(s.mastery),
            }
        )
    return out


def _grade_summary(skills_result: list[dict]) -> list[dict]:
    by_grade: dict[str, list[dict]] = defaultdict(list)
    for s in skills_result:
        by_grade[s["grade"]].append(s)

    summary = []
    for grade in GRADE_ORDER:
        items = by_grade.get(grade)
        if not items:
            continue
        total = sum(s["total"] for s in items)
        correct = sum(s["correct"] for s in items)
        rate = correct / total if total else 0.0
        counts = {"green": 0, "orange": 0, "red": 0}
        for s in items:
            counts[s["bucket"]] += 1
        summary.append(
            {
                "grade": grade,
                "total_attempts": total,
                "correct": correct,
                "rate": round(rate, 2),
                "bucket": _bucket(rate),
                "skills_count": len(items),
                "green": counts["green"],
                "orange": counts["orange"],
                "red": counts["red"],
            }
        )
    return summary
