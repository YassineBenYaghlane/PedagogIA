import json


def _as_list(value):
    if isinstance(value, list):
        return [str(x) for x in value]
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
        except (ValueError, TypeError):
            return None
        if isinstance(parsed, list):
            return [str(x) for x in parsed]
    return None


def validate(student_answer, correct_answer, params: dict) -> bool:
    student = _as_list(student_answer)
    expected = _as_list(correct_answer) or _as_list(params.get("correct_order") if params else None)
    if student is None or expected is None:
        return False
    return student == expected
