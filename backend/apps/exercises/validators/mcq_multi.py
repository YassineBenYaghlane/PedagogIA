from apps.exercises.scoring import score_mcq_multi


def validate(student_answer, correct_answer, params: dict) -> bool:
    if isinstance(correct_answer, (list, tuple)):
        correct = list(correct_answer)
    else:
        correct = [str(correct_answer)]
    min_required = params.get("min_required")
    allow_extra = bool(params.get("allow_extra_correct", False))
    is_correct, _ = score_mcq_multi(
        student_answer,
        correct,
        min_required=min_required,
        allow_extra_correct=allow_extra,
    )
    return is_correct
