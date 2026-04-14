from django.utils import timezone

from apps.skills.models import Skill
from apps.students.models import Student, StudentSkillState

NOT_STARTED = "not_started"
IN_PROGRESS = "in_progress"
MASTERED = "mastered"
NEEDS_REVIEW = "needs_review"


def _next_status(state: StudentSkillState, threshold: int, is_correct: bool) -> str:
    if is_correct:
        if state.consecutive_correct >= threshold:
            return MASTERED
        return IN_PROGRESS
    if state.status == MASTERED:
        return NEEDS_REVIEW
    return IN_PROGRESS


def update_mastery(student: Student, skill: Skill, is_correct: bool) -> StudentSkillState:
    """Record one attempt outcome and update the student's mastery state for a skill."""
    state, _ = StudentSkillState.objects.get_or_create(student=student, skill=skill)
    state.total_attempts += 1
    if is_correct:
        state.consecutive_correct += 1
        state.mastery_level = min(1.0, state.mastery_level + 0.1)
    else:
        state.consecutive_correct = 0
        state.mastery_level = max(0.0, state.mastery_level - 0.05)
    state.status = _next_status(state, skill.mastery_threshold, is_correct)
    state.last_practiced_at = timezone.now()
    state.save()
    return state
