import random

from django.core import signing

from apps.students.services.mastery import update_mastery
from src.services.exercise_gen import instantiate

from .models import Attempt, ExerciseTemplate

ANSWER_SALT = "pedagogia.exercise.answer"


def generate_exercise(skill_id: str, difficulty: int) -> dict:
    qs = ExerciseTemplate.objects.filter(skill_id=skill_id, difficulty=difficulty)
    templates = list(qs)
    if not templates:
        raise ExerciseTemplate.DoesNotExist(
            f"No template for skill={skill_id} difficulty={difficulty}"
        )
    chosen = random.choice(templates)
    generated = instantiate(chosen.template)
    signature = signing.dumps(
        {
            "template_id": chosen.id,
            "skill_id": chosen.skill_id,
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
        "prompt": generated["prompt"],
        "params": generated["params"],
        "signature": signature,
    }


def _normalize(value) -> str:
    if isinstance(value, float) and value.is_integer():
        value = int(value)
    return str(value).strip().replace(",", ".")


def record_attempt(*, session, signature, student_answer) -> Attempt:
    payload = signing.loads(signature, salt=ANSWER_SALT, max_age=60 * 60 * 6)
    template = ExerciseTemplate.objects.select_related("skill").get(id=payload["template_id"])
    correct_answer = payload["answer"]
    is_correct = _normalize(student_answer) == _normalize(correct_answer)

    attempt = Attempt.objects.create(
        session=session,
        skill=template.skill,
        template=template,
        exercise_params=payload["params"],
        student_answer=str(student_answer),
        correct_answer=str(correct_answer),
        is_correct=is_correct,
    )
    update_mastery(session.student, template.skill, is_correct)
    return attempt
