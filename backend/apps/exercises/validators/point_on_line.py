def validate(student_answer, correct_answer, params: dict) -> bool:
    """Snap-tolerant numeric compare for number-line targets."""
    try:
        student = float(str(student_answer).replace(",", "."))
        expected = float(str(correct_answer).replace(",", "."))
    except (TypeError, ValueError):
        return False
    step = float(params.get("step", 1)) if params else 1.0
    tolerance = step / 2 if step else 0.5
    return abs(student - expected) <= tolerance
