from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

import yaml

from apps.exercises.models import Attempt
from apps.skills.models import Skill
from apps.students.models import Student, StudentAchievement, StudentSkillState
from apps.students.services.mastery import MASTERED

BADGES_PATH = Path(__file__).resolve().parents[3] / "src" / "skill_tree" / "badges.yaml"


@dataclass(frozen=True)
class Badge:
    code: str
    label: str
    description: str
    icon: str
    tier: str
    trigger: dict


@lru_cache(maxsize=1)
def _load_badges() -> list[Badge]:
    with BADGES_PATH.open() as fh:
        raw = yaml.safe_load(fh) or []
    return [Badge(**b) for b in raw]


def badges_index() -> dict[str, Badge]:
    return {b.code: b for b in _load_badges()}


def _matches(badge: Badge, student: Student, context: dict) -> bool:
    trigger = badge.trigger
    kind = trigger.get("type")
    handler = TRIGGER_HANDLERS.get(kind)
    if handler is None:
        return False
    return handler(badge, student, context, trigger)


def _attempts_total(_b, student, _ctx, trigger) -> bool:
    return Attempt.objects.filter(session__student=student).count() >= int(trigger["value"])


def _correct_total(_b, student, _ctx, trigger) -> bool:
    return Attempt.objects.filter(session__student=student, is_correct=True).count() >= int(
        trigger["value"]
    )


def _session_consecutive_correct(_b, _student, context, trigger) -> bool:
    return context.get("session_consecutive_correct", 0) >= int(trigger["value"])


def _current_streak(_b, student, _ctx, trigger) -> bool:
    return student.current_streak >= int(trigger["value"])


def _mastered_count(_b, student, _ctx, trigger) -> bool:
    return StudentSkillState.objects.filter(student=student, status=MASTERED).count() >= int(
        trigger["value"]
    )


def _grade_complete(_b, student, _ctx, _trigger) -> bool:
    total = Skill.objects.filter(grade=student.grade).count()
    if total == 0:
        return False
    mastered = StudentSkillState.objects.filter(
        student=student, status=MASTERED, skill__grade=student.grade
    ).count()
    return mastered >= total


def _difficulty_correct(_b, _student, context, trigger) -> bool:
    return context.get("is_correct") and context.get("difficulty") == int(trigger["value"])


def _rank_reached(_b, _student, context, trigger) -> bool:
    return context.get("new_rank") == trigger["value"]


def _daily_goal_hit(_b, student, context, _trigger) -> bool:
    return context.get("daily_progress", 0) >= student.daily_goal


TRIGGER_HANDLERS = {
    "attempts_total": _attempts_total,
    "correct_total": _correct_total,
    "session_consecutive_correct": _session_consecutive_correct,
    "current_streak": _current_streak,
    "mastered_count": _mastered_count,
    "grade_complete": _grade_complete,
    "difficulty_correct": _difficulty_correct,
    "rank_reached": _rank_reached,
    "daily_goal_hit": _daily_goal_hit,
}


def evaluate(student: Student, context: dict) -> list[StudentAchievement]:
    """Evaluate all badges against student + context; create unseen ones; return the new rows."""
    already = set(StudentAchievement.objects.filter(student=student).values_list("code", flat=True))
    to_create = []
    for badge in _load_badges():
        if badge.code in already:
            continue
        if _matches(badge, student, context):
            to_create.append(StudentAchievement(student=student, code=badge.code))
    if not to_create:
        return []
    StudentAchievement.objects.bulk_create(to_create, ignore_conflicts=True)
    codes = [a.code for a in to_create]
    return list(
        StudentAchievement.objects.filter(student=student, code__in=codes).order_by("earned_at")
    )


def serialize_badge(code: str) -> dict:
    badge = badges_index().get(code)
    if badge is None:
        return {"code": code}
    return {
        "code": badge.code,
        "label": badge.label,
        "description": badge.description,
        "icon": badge.icon,
        "tier": badge.tier,
    }
