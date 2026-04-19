from apps.exercises.models import ExerciseTemplate
from apps.skills.models import Skill
from apps.students.models import SKILL_XP_MAX, Student, StudentSkillState


class NoSkillAvailable(Exception):
    pass


def difficulty_for_xp(skill_xp: float) -> int:
    """Tier-gated selection: skill_xp band decides which difficulty is served."""
    if skill_xp < 10:
        return 1
    if skill_xp < 20:
        return 2
    return 3


def _difficulty_for(state: StudentSkillState | None) -> int:
    return difficulty_for_xp(state.skill_xp if state else 0.0)


def _has_template_for_skill(skill: Skill) -> bool:
    return ExerciseTemplate.objects.filter(skills=skill).exists()


def pick_next_skill(student: Student) -> tuple[Skill, int]:
    """Pick the next skill to practice for a student, with a difficulty.

    Strategy:
    1. needs_review skills (oldest practiced first)
    2. mastery frontier (all prereqs mastered, this skill not yet) within student grade
    3. fallback: any in-progress skill within student grade
    """
    states = {s.skill_id: s for s in StudentSkillState.objects.filter(student=student)}
    mastered_ids = {sid for sid, s in states.items() if s.skill_xp >= SKILL_XP_MAX}

    review_candidates = [
        s for s in states.values() if s.needs_review and _has_template_for_skill(s.skill)
    ]
    if review_candidates:
        review_candidates.sort(key=lambda s: s.last_practiced_at or s.updated_at)
        state = review_candidates[0]
        return state.skill, _difficulty_for(state)

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
        if _has_template_for_skill(skill):
            frontier.append(skill)
    if frontier:
        skill = frontier[0]
        return skill, _difficulty_for(states.get(skill.id))

    in_progress = [
        s
        for s in states.values()
        if 0 < s.skill_xp < SKILL_XP_MAX and s.skill.grade == student.grade
    ]
    if in_progress:
        in_progress.sort(key=lambda s: s.last_practiced_at or s.updated_at)
        state = in_progress[0]
        return state.skill, _difficulty_for(state)

    fallback = (
        Skill.objects.filter(grade=student.grade)
        .exclude(id__in=mastered_ids)
        .filter(id__in=ExerciseTemplate.objects.values("skills").distinct())
        .order_by("id")
        .first()
    )
    if fallback is not None:
        return fallback, _difficulty_for(states.get(fallback.id))

    raise NoSkillAvailable(f"No skill available for student {student.id}")
