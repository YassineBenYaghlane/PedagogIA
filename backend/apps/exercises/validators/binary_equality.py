_ALLOWED = {"=", "≠"}


def validate(student_answer, correct_answer, params: dict) -> bool:
    s = str(student_answer).strip()
    if s not in _ALLOWED:
        return False
    return s == str(correct_answer).strip()
