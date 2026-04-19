from apps.skills.models import Skill
from apps.students.models import SKILL_XP_MAX, Student, StudentSkillState
from apps.students.services.selection import difficulty_for_xp

from .models import ExerciseTemplate
from .services import generate_exercise

DRILL_LENGTH = 15


class NoDrillSkill(Exception):
    pass


def _eligible_skills(student: Student) -> list[Skill]:
    """Skills with templates within P1..student_grade+1 (any skill with templates counts)."""
    from apps.exercises.diagnostic import GRADE_ORDER

    idx = GRADE_ORDER.index(student.grade) if student.grade in GRADE_ORDER else 0
    grades = GRADE_ORDER[: min(len(GRADE_ORDER), idx + 2)]
    skill_ids_with_templates = set(
        ExerciseTemplate.objects.values_list("skills__id", flat=True).distinct()
    )
    skill_ids_with_templates.discard(None)
    return list(Skill.objects.filter(grade__in=grades, id__in=skill_ids_with_templates))


def _priority(state: StudentSkillState | None) -> float:
    """Higher priority = practice sooner. Never-practiced ranks first, then oldest stale."""
    if state is None:
        return 1e9
    if state.skill_xp >= SKILL_XP_MAX:
        return -1.0
    if state.last_practiced_at is None:
        return 1e8
    # Older practice → higher priority (negative epoch)
    return -state.last_practiced_at.timestamp()


def pick_drill_skill(student: Student) -> tuple[Skill, int]:
    """Pick the most stale in-progress skill for a drill."""
    skills = _eligible_skills(student)
    if not skills:
        raise NoDrillSkill(f"no skill available for student {student.id}")

    states = {
        s.skill_id: s
        for s in StudentSkillState.objects.filter(
            student=student, skill_id__in=[sk.id for sk in skills]
        )
    }
    scored = sorted(skills, key=lambda s: -_priority(states.get(s.id)))
    skill = scored[0]
    state = states.get(skill.id)
    difficulty = difficulty_for_xp(state.skill_xp if state else 0.0)
    return skill, difficulty


def generate_drill_exercise(student: Student) -> dict:
    skill, difficulty = pick_drill_skill(student)
    payload = generate_exercise(skill.id, difficulty)
    payload["skill_label"] = skill.label
    payload["skill_grade"] = skill.grade
    return payload
