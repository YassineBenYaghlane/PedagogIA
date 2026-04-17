def validate(student_answer, correct_answer, params: dict) -> bool:
    return str(student_answer).strip() == str(correct_answer).strip()
