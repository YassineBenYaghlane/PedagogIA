from collections import defaultdict
from dataclasses import dataclass

from apps.skills.models import Skill
from apps.students.models import Student, StudentSkillState

from .models import Attempt, ExerciseTemplate
from .services import generate_exercise

DIAGNOSTIC_LENGTH = 20

CATEGORIES = [
    ("num", "Numération"),
    ("add", "Addition"),
    ("soustr", "Soustraction"),
    ("mult", "Multiplication"),
    ("div", "Division"),
    ("cm", "Calcul mental"),
]

GRADE_ORDER = ["P1", "P2", "P3", "P4", "P5", "P6"]

GREEN_THRESHOLD = 0.8
RED_THRESHOLD = 0.4


@dataclass
class Slot:
    skill_id: str
    difficulty: int


def _category_of(skill_id: str) -> str | None:
    prefix = skill_id.split("_", 1)[0]
    for cat, _ in CATEGORIES:
        if prefix == cat:
            return cat
    return None


def _grade_idx(grade: str) -> int:
    return GRADE_ORDER.index(grade) if grade in GRADE_ORDER else 0


def _level_bounds(student_grade: str) -> tuple[int, int]:
    """Range of levels (0..17 = P1d1..P6d3) to expose for a student."""
    idx = _grade_idx(student_grade)
    lo = max(0, (idx - 1) * 3)
    hi = min(len(GRADE_ORDER) * 3 - 1, (idx + 2) * 3 - 1)
    return lo, hi


def _level_to_target(level: int) -> tuple[str, int]:
    level = max(0, min(level, len(GRADE_ORDER) * 3 - 1))
    return GRADE_ORDER[level // 3], (level % 3) + 1


def _starting_level(student_grade: str) -> int:
    """Start a diagnostic at the easier end of the student's grade (difficulty 1)."""
    return _grade_idx(student_grade) * 3


def _compute_level(student_grade: str, attempts: list[Attempt]) -> int:
    """+1 per correct, -1 per wrong, clamped to the student's exposure window."""
    level = _starting_level(student_grade)
    for a in attempts:
        level += 1 if a.is_correct else -1
    lo, hi = _level_bounds(student_grade)
    return max(lo, min(hi, level))


def _candidate_pool(student: Student) -> dict[str, list[Skill]]:
    """Group skills-with-templates in the student's grade window by category."""
    lo, hi = _level_bounds(student.grade)
    grades = GRADE_ORDER[lo // 3 : hi // 3 + 1]
    skill_ids_with_templates = set(
        ExerciseTemplate.objects.values_list("skill_id", flat=True).distinct()
    )
    skills = list(
        Skill.objects.filter(grade__in=grades, id__in=skill_ids_with_templates).order_by(
            "grade", "id"
        )
    )
    pool: dict[str, list[Skill]] = defaultdict(list)
    for s in skills:
        cat = _category_of(s.id)
        if cat is not None:
            pool[cat].append(s)
    return pool


def _has_template(skill_id: str, difficulty: int) -> bool:
    if ExerciseTemplate.objects.filter(skill_id=skill_id, difficulty=difficulty).exists():
        return True
    return ExerciseTemplate.objects.filter(skill_id=skill_id).exists()


def select_next_slot(student: Student, attempts: list[Attempt]) -> Slot | None:
    """Choose the next (skill, difficulty) for a diagnostic.

    Adaptive: grade/difficulty drift with a running level (+1 right, -1 wrong)
    from a starting level at the student's grade. Breadth: rotate through
    categories by choosing the least-covered one among candidates.
    """
    if len(attempts) >= DIAGNOSTIC_LENGTH:
        return None

    pool = _candidate_pool(student)
    if not pool:
        return None

    covered_ids = {a.skill_id for a in attempts}
    cat_counts: dict[str, int] = {cat: 0 for cat, _ in CATEGORIES}
    for a in attempts:
        cat = _category_of(a.skill_id)
        if cat is not None:
            cat_counts[cat] += 1

    level = _compute_level(student.grade, attempts)
    target_grade, target_difficulty = _level_to_target(level)

    available_cats = [cat for cat, _ in CATEGORIES if pool.get(cat)]
    cat_order = sorted(available_cats, key=lambda c: (cat_counts[c], _grade_idx(target_grade)))

    for cat in cat_order:
        skill = _find_skill(pool[cat], target_grade, covered_ids)
        if skill is not None:
            return Slot(skill_id=skill.id, difficulty=target_difficulty)

    # fallback: any uncovered skill in any category, any grade
    for cat in cat_order:
        for skill in pool[cat]:
            if skill.id not in covered_ids:
                return Slot(skill_id=skill.id, difficulty=target_difficulty)

    # last resort: repeat a skill
    for cat in cat_order:
        if pool[cat]:
            skill = pool[cat][0]
            return Slot(skill_id=skill.id, difficulty=target_difficulty)
    return None


def _find_skill(skills: list[Skill], target_grade: str, covered: set[str]) -> Skill | None:
    target_idx = _grade_idx(target_grade)
    # prefer uncovered skills at the target grade, then adjacent grades
    uncovered = [s for s in skills if s.id not in covered]
    if not uncovered:
        return None
    uncovered.sort(key=lambda s: (abs(_grade_idx(s.grade) - target_idx), s.grade, s.id))
    return uncovered[0]


def get_exercise_for_slot(slot: Slot) -> dict:
    return generate_exercise(slot.skill_id, slot.difficulty)


def _bucket(rate: float) -> str:
    if rate >= GREEN_THRESHOLD:
        return "green"
    if rate < RED_THRESHOLD:
        return "red"
    return "orange"


def build_result(session) -> dict:
    """Aggregate diagnostic attempts into a per-skill + per-grade mastery map."""
    attempts = list(
        Attempt.objects.filter(session=session).select_related("skill").order_by("responded_at")
    )
    by_skill: dict[str, list[Attempt]] = defaultdict(list)
    for a in attempts:
        by_skill[a.skill_id].append(a)

    skill_ids = list(by_skill.keys())
    skills = {s.id: s for s in Skill.objects.filter(id__in=skill_ids)}

    state_map = {}
    if skill_ids:
        states = StudentSkillState.objects.filter(student=session.student, skill_id__in=skill_ids)
        state_map = {s.skill_id: s for s in states}

    skills_result = []
    for skill_id, items in by_skill.items():
        skill = skills.get(skill_id)
        if skill is None:
            continue
        correct = sum(1 for a in items if a.is_correct)
        total = len(items)
        rate = correct / total if total else 0.0
        state = state_map.get(skill_id)
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
                "mastery_level": round(state.mastery_level, 2) if state else 0.0,
            }
        )
    skills_result.sort(key=lambda r: (r["grade"], r["skill_id"]))

    grades = _grade_summary(skills_result)
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
        "strengths": [{"skill_id": s["skill_id"], "label": s["label"]} for s in strengths[:5]],
        "weaknesses": [{"skill_id": s["skill_id"], "label": s["label"]} for s in weaknesses[:5]],
    }


def _grade_summary(skills_result: list[dict]) -> list[dict]:
    """Roll up skill-level results to a per-grade view (green/orange/red + rate)."""
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
