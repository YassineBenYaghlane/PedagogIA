import hashlib
import random

from django.core import signing
from django.db import IntegrityError, transaction

from apps.students.models import Student
from apps.students.services.achievements import evaluate, serialize_badge
from apps.students.services.mastery import apply_template_attempt
from apps.students.services.streaks import daily_progress, update_streak
from apps.students.services.xp import award_xp
from src.services.exercise_gen import instantiate

from .models import Attempt, ExerciseTemplate
from .validators import validate as validate_answer

ANSWER_SALT = "pedagogia.exercise.answer"

MASTERY_MODES = {"training", "drill"}


class DuplicateAttempt(Exception):
    """Raised when the same answer signature is submitted more than once."""


def _signature_hash(signature: str) -> str:
    return hashlib.sha256(signature.encode("utf-8")).hexdigest()


def generate_exercise(skill_id: str, difficulty: int) -> dict:
    base_qs = ExerciseTemplate.objects.filter(skills__id=skill_id).distinct()
    templates = list(base_qs.filter(difficulty=difficulty))
    if not templates:
        available = list(base_qs)
        if not available:
            raise ExerciseTemplate.DoesNotExist(f"No template for skill={skill_id}")
        below = [t for t in available if t.difficulty <= difficulty]
        candidates = below if below else available
        candidates.sort(key=lambda t: -t.difficulty if below else t.difficulty)
        templates = [t for t in candidates if t.difficulty == candidates[0].difficulty]
    chosen = random.choice(templates)
    generated = instantiate(chosen.template)
    signature = signing.dumps(
        {
            "template_id": chosen.id,
            "input_type": chosen.input_type,
            "params": generated["params"],
            "answer": generated["answer"],
        },
        salt=ANSWER_SALT,
    )
    return {
        "template_id": chosen.id,
        "skill_id": skill_id,
        "difficulty": chosen.difficulty,
        "type": chosen.template.get("type"),
        "input_type": chosen.input_type,
        "prompt": generated["prompt"],
        "params": generated["params"],
        "signature": signature,
    }


def record_attempt(*, session, signature, student_answer) -> tuple[Attempt, dict]:
    payload = signing.loads(signature, salt=ANSWER_SALT, max_age=60 * 60 * 6)
    template = ExerciseTemplate.objects.prefetch_related("skill_weights").get(
        id=payload["template_id"]
    )
    correct_answer = payload["answer"]
    input_type = payload.get("input_type") or template.input_type
    is_correct = validate_answer(input_type, student_answer, correct_answer, payload["params"])
    sig_hash = _signature_hash(signature)

    n_skills = template.skill_weights.count() or 1

    with transaction.atomic():
        student = Student.objects.select_for_update().get(pk=session.student_id)
        session.student = student
        xp_delta, new_rank = award_xp(student, is_correct, template.difficulty, n_skills)
        try:
            attempt = Attempt.objects.create(
                session=session,
                template=template,
                exercise_params=payload["params"],
                student_answer=str(student_answer),
                correct_answer=str(correct_answer),
                is_correct=is_correct,
                xp_awarded=xp_delta,
                signature_hash=sig_hash,
            )
        except IntegrityError as exc:
            raise DuplicateAttempt("signature already used") from exc
        if session.mode in MASTERY_MODES:
            apply_template_attempt(student, template, is_correct)
        update_streak(student)
        progress = daily_progress(student)
        context = {
            "is_correct": is_correct,
            "difficulty": template.difficulty,
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
