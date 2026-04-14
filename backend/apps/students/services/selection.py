from apps.exercises.models import ExerciseTemplate
from apps.skills.models import Skill
from apps.students.models import Student, StudentSkillState

from .mastery import IN_PROGRESS, MASTERED, NEEDS_REVIEW


class NoSkillAvailable(Exception):
    pass


def _difficulty_for(state: StudentSkillState | None) -> int:
    if state is None or state.mastery_level < 0.3:
        return 1
    if state.mastery_level < 0.7:
        return 2
    return 3


def pick_next_skill(student: Student) -> tuple[Skill, int]:
    """Pick the next skill to practice for a student, with a difficulty.

    Strategy:
    1. needs_review skills (oldest practiced first)
    2. mastery frontier (all prereqs mastered, this skill not yet) within student grade
    3. fallback: any in_progress skill within student grade
    """
    states = {s.skill_id: s for s in StudentSkillState.objects.filter(student=student)}
    mastered_ids = {sid for sid, s in states.items() if s.status == MASTERED}

    review = (
        StudentSkillState.objects.filter(student=student, status=NEEDS_REVIEW)
        .select_related("skill")
        .order_by("last_practiced_at")
        .first()
    )
    if review is not None:
        return review.skill, _difficulty_for(review)

    candidates = (
        Skill.objects.filter(grade=student.grade)
        .exclude(id__in=mastered_ids)
        .prefetch_related("prerequisites")
    )
    frontier = []
    for skill in candidates:
        prereq_ids = {p.id for p in skill.prerequisites.all()}
        if not prereq_ids.issubset(mastered_ids):
            continue
        if ExerciseTemplate.objects.filter(skill=skill).exists():
            frontier.append(skill)
    if frontier:
        skill = frontier[0]
        return skill, _difficulty_for(states.get(skill.id))

    in_progress = (
        StudentSkillState.objects.filter(
            student=student, status=IN_PROGRESS, skill__grade=student.grade
        )
        .select_related("skill")
        .order_by("last_practiced_at")
        .first()
    )
    if in_progress is not None:
        return in_progress.skill, _difficulty_for(in_progress)

    fallback = (
        Skill.objects.filter(grade=student.grade)
        .exclude(id__in=mastered_ids)
        .filter(id__in=ExerciseTemplate.objects.values("skill_id"))
        .order_by("id")
        .first()
    )
    if fallback is not None:
        return fallback, _difficulty_for(states.get(fallback.id))

    raise NoSkillAvailable(f"No skill available for student {student.id}")
