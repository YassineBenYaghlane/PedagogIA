def _normalize(value) -> str:
    if isinstance(value, float) and value.is_integer():
        value = int(value)
    return str(value).strip().replace(",", ".")


def validate(student_answer, correct_answer, params: dict) -> bool:
    return _normalize(student_answer) == _normalize(correct_answer)
