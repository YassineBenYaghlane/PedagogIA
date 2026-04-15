from apps.students.models import Student

BASE_XP = 10
DIFFICULTY_MULT = {1: 1.0, 2: 1.5, 3: 2.0}
STREAK_BONUS = [(10, 10), (5, 5), (3, 2)]

RANKS = [
    ("curieux", 0),
    ("calculateur", 100),
    ("arithmeticien", 300),
    ("mathematicien", 700),
    ("savant", 1500),
]


def rank_for_xp(xp: int) -> str:
    current = RANKS[0][0]
    for code, threshold in RANKS:
        if xp >= threshold:
            current = code
    return current


def xp_for_answer(is_correct: bool, difficulty: int, session_consecutive_correct: int) -> int:
    if not is_correct:
        return 0
    mult = DIFFICULTY_MULT.get(difficulty, 1.0)
    xp = BASE_XP * mult
    for threshold, bonus in STREAK_BONUS:
        if session_consecutive_correct >= threshold:
            xp += bonus
            break
    return int(xp)


def award_xp(
    student: Student, is_correct: bool, difficulty: int, session_consecutive_correct: int
) -> tuple[int, str | None]:
    """Apply XP for one attempt. Returns (xp_delta, new_rank) or (delta, None)."""
    delta = xp_for_answer(is_correct, difficulty, session_consecutive_correct)
    if delta == 0:
        return 0, None
    prev_rank = student.rank
    student.xp += delta
    new_rank = rank_for_xp(student.xp)
    if new_rank != prev_rank:
        student.rank = new_rank
        student.save(update_fields=["xp", "rank"])
        return delta, new_rank
    student.save(update_fields=["xp"])
    return delta, None
