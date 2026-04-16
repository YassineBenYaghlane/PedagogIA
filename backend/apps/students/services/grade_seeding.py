from apps.skills.models import Skill
from apps.students.models import Student, StudentSkillState


def seed_prior_grade_mastery(student: Student) -> int:
    """Mark every skill from strictly lower grades as mastered. Called on student creation."""
    prior_skills = Skill.objects.filter(grade__lt=student.grade)
    if not prior_skills.exists():
        return 0
    existing = set(
        StudentSkillState.objects.filter(student=student, skill__in=prior_skills).values_list(
            "skill_id", flat=True
        )
    )
    rows = [
        StudentSkillState(
            student=student,
            skill=skill,
            status=StudentSkillState.MASTERED,
            mastery_level=1.0,
            consecutive_correct=skill.mastery_threshold,
            total_attempts=skill.mastery_threshold,
        )
        for skill in prior_skills
        if skill.id not in existing
    ]
    StudentSkillState.objects.bulk_create(rows)
    return len(rows)
