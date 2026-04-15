from django.utils import timezone

from apps.skills.models import Skill
from apps.students.models import Student, StudentSkillState
from apps.students.services.mastery import is_automatisme

from .models import ExerciseTemplate
from .services import generate_exercise

DRILL_LENGTH = 15


class NoDrillSkill(Exception):
    pass


def _eligible_skills(student: Student) -> list[Skill]:
    """Automatismes (fact-recall) within P1..student_grade+1 that have templates."""
    from apps.exercises.diagnostic import GRADE_ORDER

    idx = GRADE_ORDER.index(student.grade) if student.grade in GRADE_ORDER else 0
    grades = GRADE_ORDER[: min(len(GRADE_ORDER), idx + 2)]
    skill_ids_with_templates = set(
        ExerciseTemplate.objects.values_list("skill_id", flat=True).distinct()
    )
    return [
        s
        for s in Skill.objects.filter(grade__in=grades, id__in=skill_ids_with_templates)
        if is_automatisme(s)
    ]


def _priority(state: StudentSkillState | None, now) -> float:
    """Higher = more overdue. Never-practiced skills rank before mastered-and-fresh ones."""
    if state is None:
        return 1e6  # prioritize discovery
    if state.next_review_at is None:
        return 1e5
    overdue_s = (now - state.next_review_at).total_seconds()
    return overdue_s


def pick_drill_skill(student: Student) -> tuple[Skill, int]:
    """Pick the most overdue automatisme skill for a drill; fallback to least-practiced."""
    skills = _eligible_skills(student)
    if not skills:
        raise NoDrillSkill(f"no automatisme skill available for student {student.id}")

    states = {
        s.skill_id: s
        for s in StudentSkillState.objects.filter(
            student=student, skill_id__in=[sk.id for sk in skills]
        )
    }
    now = timezone.now()
    scored = sorted(
        skills,
        key=lambda s: -_priority(states.get(s.id), now),
    )
    skill = scored[0]
    state = states.get(skill.id)
    difficulty = 1 if state is None or state.mastery_level < 0.5 else 2
    return skill, difficulty


def generate_drill_exercise(student: Student) -> dict:
    skill, difficulty = pick_drill_skill(student)
    payload = generate_exercise(skill.id, difficulty)
    payload["skill_label"] = skill.label
    payload["skill_grade"] = skill.grade
    return payload
