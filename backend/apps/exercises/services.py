import random

from django.utils import timezone

from apps.students.models import StudentSkillState
from src.services.exercise_gen import instantiate

from .models import Attempt, ExerciseTemplate


def generate_exercise(skill_id: str, difficulty: int) -> dict:
    qs = ExerciseTemplate.objects.filter(skill_id=skill_id, difficulty=difficulty)
    templates = list(qs)
    if not templates:
        raise ExerciseTemplate.DoesNotExist(
            f"No template for skill={skill_id} difficulty={difficulty}"
        )
    chosen = random.choice(templates)
    generated = instantiate(chosen.template)
    return {
        "template_id": chosen.id,
        "skill_id": chosen.skill_id,
        "difficulty": chosen.difficulty,
        "type": chosen.template.get("type"),
        "prompt": generated["prompt"],
        "answer": generated["answer"],
        "params": generated["params"],
    }


def record_attempt(
    *, session, skill, template, exercise_params, student_answer, correct_answer, is_correct
) -> Attempt:
    attempt = Attempt.objects.create(
        session=session,
        skill=skill,
        template=template,
        exercise_params=exercise_params,
        student_answer=student_answer,
        correct_answer=correct_answer,
        is_correct=is_correct,
    )
    state, _ = StudentSkillState.objects.get_or_create(student=session.student, skill=skill)
    state.total_attempts += 1
    if is_correct:
        state.consecutive_correct += 1
        state.mastery_level = min(1.0, state.mastery_level + 0.1)
    else:
        state.consecutive_correct = 0
        state.mastery_level = max(0.0, state.mastery_level - 0.05)
    state.last_practiced_at = timezone.now()
    state.save()
    return attempt
