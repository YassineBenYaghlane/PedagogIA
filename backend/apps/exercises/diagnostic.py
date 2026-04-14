import hashlib
import random
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
class PlanSlot:
    skill_id: str
    difficulty: int


def _category_of(skill_id: str) -> str | None:
    prefix = skill_id.split("_", 1)[0]
    for cat, _ in CATEGORIES:
        if prefix == cat:
            return cat
    return None


def _grades_window(grade: str) -> list[str]:
    if grade not in GRADE_ORDER:
        return GRADE_ORDER
    idx = GRADE_ORDER.index(grade)
    start = max(0, idx - 1)
    end = min(len(GRADE_ORDER), idx + 2)
    return GRADE_ORDER[start:end]


def _difficulty_for(skill_grade: str, student_grade: str) -> int:
    if skill_grade not in GRADE_ORDER or student_grade not in GRADE_ORDER:
        return 1
    diff = GRADE_ORDER.index(skill_grade) - GRADE_ORDER.index(student_grade)
    if diff < 0:
        return 1
    if diff == 0:
        return 2
    return 3


def _seed_from(session_id) -> int:
    digest = hashlib.sha256(str(session_id).encode()).digest()
    return int.from_bytes(digest[:8], "big")


def build_plan(student: Student, session_id) -> list[PlanSlot]:
    """Build a breadth-sampling plan of ~20 (skill, difficulty) slots for a diagnostic.

    Groups candidate skills by category and grade within the student's grade window,
    then draws round-robin across categories for balanced coverage.
    """
    grades = _grades_window(student.grade)
    skill_ids_with_templates = set(
        ExerciseTemplate.objects.values_list("skill_id", flat=True).distinct()
    )
    skills = list(
        Skill.objects.filter(grade__in=grades, id__in=skill_ids_with_templates).order_by(
            "grade", "id"
        )
    )

    by_cat: dict[str, list[Skill]] = defaultdict(list)
    for s in skills:
        cat = _category_of(s.id)
        if cat is not None:
            by_cat[cat].append(s)

    rng = random.Random(_seed_from(session_id))
    for bucket in by_cat.values():
        # prioritize skills at or below the student's grade, then shuffle within
        bucket.sort(
            key=lambda s: (
                GRADE_ORDER.index(s.grade) if s.grade in GRADE_ORDER else 99,
                rng.random(),
            )
        )

    plan: list[PlanSlot] = []
    categories_in_order = [c for c, _ in CATEGORIES if by_cat.get(c)]
    rng.shuffle(categories_in_order)

    exhausted: set[str] = set()
    while len(plan) < DIAGNOSTIC_LENGTH and len(exhausted) < len(categories_in_order):
        for cat in categories_in_order:
            if cat in exhausted:
                continue
            bucket = by_cat[cat]
            if not bucket:
                exhausted.add(cat)
                continue
            skill = bucket.pop(0)
            plan.append(
                PlanSlot(
                    skill_id=skill.id,
                    difficulty=_difficulty_for(skill.grade, student.grade),
                )
            )
            if not bucket:
                exhausted.add(cat)
            if len(plan) >= DIAGNOSTIC_LENGTH:
                break

    return plan


def get_exercise_for_slot(slot: PlanSlot) -> dict:
    return generate_exercise(slot.skill_id, slot.difficulty)


def _bucket(rate: float) -> str:
    if rate >= GREEN_THRESHOLD:
        return "green"
    if rate < RED_THRESHOLD:
        return "red"
    return "orange"


def build_result(session) -> dict:
    """Aggregate diagnostic session attempts into a per-skill mastery map + summary."""
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
        "strengths": [{"skill_id": s["skill_id"], "label": s["label"]} for s in strengths[:5]],
        "weaknesses": [{"skill_id": s["skill_id"], "label": s["label"]} for s in weaknesses[:5]],
    }
