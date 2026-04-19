from apps.students.models import Student

BASE_BY_DIFFICULTY = {1: 10, 2: 20, 3: 30}
SKILLS_MULTIPLIER = {1: 1.0, 2: 1.4}  # 3+ caps at 1.8 (see _multiplier)

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


def _multiplier(n_skills: int) -> float:
    if n_skills <= 1:
        return 1.0
    if n_skills == 2:
        return 1.4
    return 1.8


def compute_xp(difficulty: int, n_skills: int) -> int:
    """XP for a correct attempt: base(difficulty) × multiplier(n_skills)."""
    base = BASE_BY_DIFFICULTY.get(difficulty, 10)
    return round(base * _multiplier(n_skills))


def xp_for_answer(is_correct: bool, difficulty: int, n_skills: int) -> int:
    if not is_correct:
        return 0
    return compute_xp(difficulty, n_skills)


def award_xp(
    student: Student, is_correct: bool, difficulty: int, n_skills: int
) -> tuple[int, str | None]:
    """Apply XP for one attempt. Returns (xp_delta, new_rank) or (delta, None)."""
    delta = xp_for_answer(is_correct, difficulty, n_skills)
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
