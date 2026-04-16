import json


def _as_mapping(value):
    """Accept JSON dict or fall back to None."""
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
        except (ValueError, TypeError):
            return None
        return parsed if isinstance(parsed, dict) else None
    return None


def validate(student_answer, correct_answer, params: dict) -> bool:
    """Compare place-value mappings (e.g. {'dizaines': 1, 'unités': 3})."""
    expected_parts = params.get("parts") if params else None
    student_parts = _as_mapping(student_answer)

    if expected_parts and student_parts is not None:
        for place, value in expected_parts.items():
            if int(student_parts.get(place, 0)) != int(value):
                return False
        return True

    return str(student_answer).strip() == str(correct_answer).strip()
