import random

from apps.skills.models import Skill
from apps.students.models import Student

from .models import ExerciseTemplate
from .services import generate_exercise

EXAM_LENGTH = 10
EXAM_DIFFICULTY = 2


class NoExamSkill(Exception):
    pass


def _eligible_skills(student: Student) -> list[Skill]:
    """All skills in the student's current grade with at least one exercise template."""
    skill_ids_with_templates = set(
        ExerciseTemplate.objects.values_list("skills__id", flat=True).distinct()
    )
    skill_ids_with_templates.discard(None)
    return list(Skill.objects.filter(grade=student.grade, id__in=skill_ids_with_templates))


def pick_exam_skill(student: Student) -> tuple[Skill, int]:
    """Pick a random skill for an exam question — uniform across the grade range."""
    skills = _eligible_skills(student)
    if not skills:
        raise NoExamSkill(f"no skill available for student {student.id}")
    skill = random.choice(skills)
    return skill, EXAM_DIFFICULTY


def generate_exam_exercise(student: Student) -> dict:
    skill, difficulty = pick_exam_skill(student)
    payload = generate_exercise(skill.id, difficulty)
    payload["skill_label"] = skill.label
    payload["skill_grade"] = skill.grade
    return payload
