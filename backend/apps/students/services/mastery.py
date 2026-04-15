from datetime import timedelta

from django.utils import timezone

from apps.skills.models import Skill
from apps.students.models import Student, StudentSkillState

NOT_STARTED = "not_started"
IN_PROGRESS = "in_progress"
MASTERED = "mastered"
NEEDS_REVIEW = "needs_review"

AUTOMATISME_THRESHOLD = 5
MIN_INTERVAL_HOURS = 4
MAX_INTERVAL_HOURS = 24 * 30


def is_automatisme(skill: Skill) -> bool:
    """Fact-recall skills use high thresholds (≥5); treat them as automatismes."""
    return skill.mastery_threshold >= AUTOMATISME_THRESHOLD


def _next_status(state: StudentSkillState, threshold: int, is_correct: bool) -> str:
    if is_correct:
        if state.consecutive_correct >= threshold:
            return MASTERED
        return IN_PROGRESS
    if state.status == MASTERED:
        return NEEDS_REVIEW
    return IN_PROGRESS


def _schedule_review(state: StudentSkillState, skill: Skill, is_correct: bool, now) -> None:
    """SM-2-lite: double interval on correct, reset on wrong. Automatismes only."""
    if not is_automatisme(skill):
        state.next_review_at = None
        return
    if is_correct:
        hours = max(MIN_INTERVAL_HOURS, state.review_interval_hours * 2)
    else:
        hours = MIN_INTERVAL_HOURS
    hours = min(hours, MAX_INTERVAL_HOURS)
    state.review_interval_hours = hours
    state.next_review_at = now + timedelta(hours=hours)


def update_mastery(student: Student, skill: Skill, is_correct: bool) -> StudentSkillState:
    """Record one attempt outcome and update mastery + review schedule for a skill."""
    state, _ = StudentSkillState.objects.get_or_create(student=student, skill=skill)
    state.total_attempts += 1
    if is_correct:
        state.consecutive_correct += 1
        state.mastery_level = min(1.0, state.mastery_level + 0.1)
    else:
        state.consecutive_correct = 0
        state.mastery_level = max(0.0, state.mastery_level - 0.05)
    state.status = _next_status(state, skill.mastery_threshold, is_correct)
    now = timezone.now()
    state.last_practiced_at = now
    _schedule_review(state, skill, is_correct, now)
    state.save()
    return state
