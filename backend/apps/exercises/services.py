import random

from django.core import signing
from django.db import transaction

from apps.students.services.achievements import evaluate, serialize_badge
from apps.students.services.mastery import update_mastery
from apps.students.services.streaks import daily_progress, update_streak
from apps.students.services.xp import award_xp
from src.services.exercise_gen import instantiate

from .models import Attempt, ExerciseTemplate
from .validators import validate as validate_answer

ANSWER_SALT = "pedagogia.exercise.answer"


def generate_exercise(skill_id: str, difficulty: int) -> dict:
    templates = list(ExerciseTemplate.objects.filter(skill_id=skill_id, difficulty=difficulty))
    if not templates:
        available = list(ExerciseTemplate.objects.filter(skill_id=skill_id))
        if not available:
            raise ExerciseTemplate.DoesNotExist(f"No template for skill={skill_id}")
        # fall back to the closest difficulty below, else the lowest available
        below = [t for t in available if t.difficulty <= difficulty]
        templates = below if below else available
        templates.sort(key=lambda t: -t.difficulty if below else t.difficulty)
        templates = [t for t in templates if t.difficulty == templates[0].difficulty]
    chosen = random.choice(templates)
    generated = instantiate(chosen.template)
    signature = signing.dumps(
        {
            "template_id": chosen.id,
            "skill_id": chosen.skill_id,
            "input_type": chosen.input_type,
            "params": generated["params"],
            "answer": generated["answer"],
        },
        salt=ANSWER_SALT,
    )
    return {
        "template_id": chosen.id,
        "skill_id": chosen.skill_id,
        "difficulty": chosen.difficulty,
        "type": chosen.template.get("type"),
        "input_type": chosen.input_type,
        "prompt": generated["prompt"],
        "params": generated["params"],
        "signature": signature,
    }


def _session_consecutive_correct(session) -> int:
    count = 0
    for a in Attempt.objects.filter(session=session).order_by("-responded_at"):
        if a.is_correct:
            count += 1
        else:
            break
    return count


def record_attempt(*, session, signature, student_answer) -> tuple[Attempt, dict]:
    payload = signing.loads(signature, salt=ANSWER_SALT, max_age=60 * 60 * 6)
    template = ExerciseTemplate.objects.select_related("skill").get(id=payload["template_id"])
    correct_answer = payload["answer"]
    input_type = payload.get("input_type") or template.input_type
    is_correct = validate_answer(input_type, student_answer, correct_answer, payload["params"])

    with transaction.atomic():
        attempt = Attempt.objects.create(
            session=session,
            skill=template.skill,
            template=template,
            input_type=input_type,
            exercise_params=payload["params"],
            student_answer=str(student_answer),
            correct_answer=str(correct_answer),
            is_correct=is_correct,
        )
        update_mastery(session.student, template.skill, is_correct)
        student = session.student
        update_streak(student)
        consecutive = _session_consecutive_correct(session)
        xp_delta, new_rank = award_xp(student, is_correct, template.difficulty, consecutive)
        progress = daily_progress(student)
        context = {
            "is_correct": is_correct,
            "difficulty": template.difficulty,
            "session_consecutive_correct": consecutive,
            "new_rank": new_rank,
            "daily_progress": progress,
        }
        new_badges = evaluate(student, context)

    gamification = {
        "xp_delta": xp_delta,
        "xp_total": student.xp,
        "rank": student.rank,
        "rank_changed": new_rank is not None,
        "current_streak": student.current_streak,
        "best_streak": student.best_streak,
        "daily_goal": student.daily_goal,
        "daily_progress": progress,
        "newly_earned_badges": [serialize_badge(a.code) for a in new_badges],
    }
    return attempt, gamification
