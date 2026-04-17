"""Stairs-policy adaptive diagnostic across P1..P6.

The algorithm walks the student up or down the (grade, difficulty) ladder.

  Correct answer → climb (after a short in-year exploration phase)
  Wrong answer   → descend, with inertia: a single wrong answer in an
                   otherwise-good window first retries another skill
                   before committing to the step-down.
  Floor / ceiling hit → terminate.

Within a (grade, difficulty) pair, rotate through arithmetic categories
(num / add / soustr / mult / div / cm) so the student sees breadth before
the cursor moves.

The verdict is the highest grade where the student answered enough
questions and held a success rate ≥ VERDICT_RATE at difficulty ≥ 2.
"""

from collections import defaultdict
from dataclasses import dataclass, field

from apps.skills.models import Skill
from apps.students.models import Student, StudentSkillState

from .models import Attempt, ExerciseTemplate
from .services import generate_exercise

DIAGNOSTIC_MAX_LENGTH = 25
DIAGNOSTIC_MIN_LENGTH = 6

DIAGNOSTIC_LENGTH = DIAGNOSTIC_MAX_LENGTH  # legacy alias

CATEGORIES = [
    ("num", "Numération"),
    ("add", "Addition"),
    ("soustr", "Soustraction"),
    ("mult", "Multiplication"),
    ("div", "Division"),
    ("cm", "Calcul mental"),
]

GRADE_ORDER = ["P1", "P2", "P3", "P4", "P5", "P6"]

# Stairs tuning
EXPLORE_MIN_CATEGORIES = 2
EXPLORE_MIN_SKILLS = 2
INERTIA_WINDOW = 3
INERTIA_MISSES_TO_DESCEND = 2

GREEN_THRESHOLD = 0.8
RED_THRESHOLD = 0.4
VERDICT_RATE = 0.7
VERDICT_MIN_N = 3
VERDICT_MIN_DIFFICULTY = 2


@dataclass
class Slot:
    skill_id: str
    difficulty: int


@dataclass
class Cursor:
    grade: str
    difficulty: int

    def at_floor(self) -> bool:
        return self.grade == GRADE_ORDER[0] and self.difficulty == 1

    def at_ceiling(self) -> bool:
        return self.grade == GRADE_ORDER[-1] and self.difficulty == 3


@dataclass
class YearState:
    grade: str
    n: int = 0
    correct: int = 0
    correct_by_diff: dict[int, int] = field(default_factory=lambda: {1: 0, 2: 0, 3: 0})
    total_by_diff: dict[int, int] = field(default_factory=lambda: {1: 0, 2: 0, 3: 0})
    covered_skills: set[str] = field(default_factory=set)
    covered_categories: set[str] = field(default_factory=set)
    visits: int = 0

    @property
    def rate(self) -> float:
        return self.correct / self.n if self.n else 0.0

    def max_difficulty_reached(self) -> int:
        return max((d for d, total in self.total_by_diff.items() if total > 0), default=0)


def _category_of(skill_id: str) -> str | None:
    prefix = skill_id.split("_", 1)[0]
    for cat, _ in CATEGORIES:
        if prefix == cat:
            return cat
    return None


def _bump_state(state: YearState, skill_id: str, difficulty: int, is_correct: bool) -> None:
    state.n += 1
    state.total_by_diff[difficulty] = state.total_by_diff.get(difficulty, 0) + 1
    if is_correct:
        state.correct += 1
        state.correct_by_diff[difficulty] = state.correct_by_diff.get(difficulty, 0) + 1
    state.covered_skills.add(skill_id)
    cat = _category_of(skill_id)
    if cat is not None:
        state.covered_categories.add(cat)


def _template_pool() -> dict[tuple[str, int], dict[str, list[str]]]:
    pool: dict[tuple[str, int], dict[str, list[str]]] = defaultdict(lambda: defaultdict(list))
    rows = ExerciseTemplate.objects.select_related("skill").values(
        "skill_id", "skill__grade", "difficulty"
    )
    seen: set[tuple[str, int]] = set()
    for row in rows:
        key = (row["skill_id"], row["difficulty"])
        if key in seen:
            continue
        seen.add(key)
        cat = _category_of(row["skill_id"])
        if cat is None:
            continue
        pool[(row["skill__grade"], row["difficulty"])][cat].append(row["skill_id"])
    return pool


def _nearest_cell(
    pool: dict[tuple[str, int], dict[str, list[str]]], grade: str, difficulty: int
) -> tuple[str, int] | None:
    """Closest (grade, difficulty) cell with templates within bounds."""
    gi = GRADE_ORDER.index(grade) if grade in GRADE_ORDER else 0
    for delta in range(0, max(len(GRADE_ORDER), 3)):
        for dg in (0, -delta, delta) if delta else (0,):
            g_idx = gi + dg
            if not 0 <= g_idx < len(GRADE_ORDER):
                continue
            g = GRADE_ORDER[g_idx]
            for dd in (0, -delta, delta) if delta else (0,):
                d = difficulty + dd
                if not 1 <= d <= 3:
                    continue
                if pool.get((g, d)):
                    return g, d
    return None


def _init_cursor(student: Student) -> Cursor:
    grade = student.grade if student.grade in GRADE_ORDER else "P3"
    return Cursor(grade=grade, difficulty=1)


def _recent_outcomes_at_grade(grade: str, attempts: list[Attempt], up_to: int) -> list[bool]:
    recent: list[bool] = []
    for a in reversed(attempts[:up_to]):
        if getattr(a.skill, "grade", None) == grade:
            recent.append(a.is_correct)
            if len(recent) >= INERTIA_WINDOW:
                break
    return list(reversed(recent))


def _step_cursor(
    cursor: Cursor,
    states: dict[str, YearState],
    attempts: list[Attempt],
    up_to: int,
) -> Cursor:
    """Decide the next cursor after up_to attempts are folded into `states`."""
    if up_to == 0:
        return cursor
    last = attempts[up_to - 1]
    last_grade = getattr(last.skill, "grade", None)
    if last_grade != cursor.grade:
        return cursor

    state = states[cursor.grade]
    if last.is_correct:
        enough_breadth = (
            len(state.covered_categories) >= EXPLORE_MIN_CATEGORIES
            and len(state.covered_skills) >= EXPLORE_MIN_SKILLS
        )
        if not enough_breadth:
            return cursor
        if cursor.difficulty < 3:
            return Cursor(cursor.grade, cursor.difficulty + 1)
        idx = GRADE_ORDER.index(cursor.grade)
        if idx + 1 < len(GRADE_ORDER):
            return Cursor(GRADE_ORDER[idx + 1], 1)
        return cursor

    window = _recent_outcomes_at_grade(cursor.grade, attempts, up_to)
    misses = sum(1 for ok in window if not ok)
    if cursor.difficulty > 1 and misses < INERTIA_MISSES_TO_DESCEND:
        return cursor
    if cursor.difficulty > 1:
        return Cursor(cursor.grade, cursor.difficulty - 1)
    idx = GRADE_ORDER.index(cursor.grade)
    if idx > 0:
        return Cursor(GRADE_ORDER[idx - 1], 3)
    return cursor


def _replay(student: Student, attempts: list[Attempt]) -> tuple[Cursor, dict[str, YearState]]:
    states: dict[str, YearState] = {g: YearState(grade=g) for g in GRADE_ORDER}
    cursor = _init_cursor(student)
    states[cursor.grade].visits = 1
    for i, a in enumerate(attempts):
        grade = getattr(a.skill, "grade", None)
        if grade in states and a.template_id:
            _bump_state(states[grade], a.skill_id, a.template.difficulty, a.is_correct)
        new_cursor = _step_cursor(cursor, states, attempts, up_to=i + 1)
        if (new_cursor.grade, new_cursor.difficulty) != (cursor.grade, cursor.difficulty):
            states[new_cursor.grade].visits += 1
            cursor = new_cursor
    return cursor, states


def _pick_skill(
    pool: dict[tuple[str, int], dict[str, list[str]]],
    cursor: Cursor,
    state: YearState,
    session_covered: set[str],
) -> Slot | None:
    cell_pool = pool.get((cursor.grade, cursor.difficulty))
    if not cell_pool:
        fallback = _nearest_cell(pool, cursor.grade, cursor.difficulty)
        if fallback is None:
            return None
        cursor = Cursor(fallback[0], fallback[1])
        cell_pool = pool.get((cursor.grade, cursor.difficulty), {})

    cat_count = {cat: 0 for cat, _ in CATEGORIES}
    for sid in state.covered_skills:
        c = _category_of(sid)
        if c is not None:
            cat_count[c] = cat_count.get(c, 0) + 1
    cat_order = sorted(cat_count, key=lambda c: (cat_count[c], c))

    def rank(sid: str) -> tuple[int, int]:
        year_covered = sid in state.covered_skills
        session_cov = sid in session_covered
        return (int(year_covered) * 2 + int(session_cov), 0)

    for cat in cat_order:
        skills = sorted(cell_pool.get(cat, []), key=rank)
        if skills:
            return Slot(skill_id=skills[0], difficulty=cursor.difficulty)
    for skills in cell_pool.values():
        if skills:
            return Slot(skill_id=sorted(skills, key=rank)[0], difficulty=cursor.difficulty)
    return None


def _should_stop(cursor: Cursor, states: dict[str, YearState], attempts: list[Attempt]) -> bool:
    n = len(attempts)
    if n >= DIAGNOSTIC_MAX_LENGTH:
        return True
    if n < DIAGNOSTIC_MIN_LENGTH or not attempts:
        return False
    last = attempts[-1]
    if not last.is_correct and cursor.at_floor():
        if states["P1"].n >= 3:
            return True
    if last.is_correct and cursor.at_ceiling():
        s = states["P6"]
        if s.n >= 3 and len(s.covered_skills) >= 2:
            return True
    return False


def select_next_slot(student: Student, attempts: list[Attempt]) -> Slot | None:
    cursor, states = _replay(student, attempts)
    if _should_stop(cursor, states, attempts):
        return None
    pool = _template_pool()
    if not pool:
        return None
    state = states[cursor.grade]
    session_covered = {a.skill_id for a in attempts}
    return _pick_skill(pool, cursor, state, session_covered)


def get_exercise_for_slot(slot: Slot) -> dict:
    return generate_exercise(slot.skill_id, slot.difficulty)


def _bucket(rate: float) -> str:
    if rate >= GREEN_THRESHOLD:
        return "green"
    if rate < RED_THRESHOLD:
        return "red"
    return "orange"


def _fwb_verdict(student: Student, states: dict[str, YearState], attempts: list[Attempt]) -> dict:
    best: str | None = None
    best_rate = 0.0
    for grade in GRADE_ORDER:
        s = states[grade]
        if s.n < VERDICT_MIN_N:
            continue
        if s.max_difficulty_reached() < VERDICT_MIN_DIFFICULTY:
            continue
        if s.rate >= VERDICT_RATE:
            best = grade
            best_rate = s.rate
    if best is None:
        for grade in GRADE_ORDER:
            if states[grade].n >= 2 and states[grade].rate >= VERDICT_RATE * 0.8:
                best = grade
                best_rate = states[grade].rate
                break
    if best is None:
        return {
            "level": None,
            "confidence": 0.0,
            "narrative": (
                "Données insuffisantes pour estimer un niveau FWB. "
                "Refaites le diagnostic pour affiner."
            ),
        }
    return {
        "level": best,
        "confidence": round(best_rate, 2),
        "narrative": _verdict_narrative(best, states, student),
    }


def _verdict_narrative(level: str, states: dict[str, YearState], student: Student) -> str:
    mastered = [g for g in GRADE_ORDER if states[g].n >= 2 and states[g].rate >= VERDICT_RATE]
    shaky = [
        g
        for g in GRADE_ORDER
        if states[g].n >= 2 and RED_THRESHOLD <= states[g].rate < VERDICT_RATE
    ]
    parts = [f"Niveau FWB estimé : {level}."]
    declared = student.grade if student.grade in GRADE_ORDER else None
    if declared and declared != level:
        if GRADE_ORDER.index(level) > GRADE_ORDER.index(declared):
            parts.append(f"Au-dessus du niveau déclaré ({declared}).")
        else:
            parts.append(f"En deçà du niveau déclaré ({declared}).")
    if mastered:
        parts.append(f"Solide sur {', '.join(mastered)}.")
    if shaky:
        parts.append(f"Encore fragile sur {', '.join(shaky)}.")
    return " ".join(parts)


def build_result(session) -> dict:
    attempts = list(
        Attempt.objects.filter(session=session)
        .select_related("skill", "template")
        .order_by("responded_at")
    )

    _, states = _replay(session.student, attempts)

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
    verdict = _fwb_verdict(session.student, states, attempts)

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
        out.append(
            {
                "grade": grade,
                "n": s.n,
                "correct": s.correct,
                "max_difficulty": s.max_difficulty_reached(),
                "rate": round(s.rate, 2),
                "bucket": _bucket(s.rate),
                "categories": sorted(s.covered_categories),
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
