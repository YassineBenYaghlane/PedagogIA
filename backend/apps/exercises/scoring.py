"""Scoring helpers for compound answer shapes (multi-correct MCQ, etc.)."""

from __future__ import annotations

import json


def _parse_selection(raw) -> set[str]:
    """Normalize a student's multi-select answer to a set of strings."""
    if raw is None:
        return set()
    if isinstance(raw, (list, tuple, set)):
        return {str(x).strip() for x in raw if str(x).strip()}
    text = str(raw).strip()
    if not text:
        return set()
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        return {s.strip() for s in text.split(",") if s.strip()}
    if isinstance(parsed, (list, tuple)):
        return {str(x).strip() for x in parsed if str(x).strip()}
    return {str(parsed).strip()}


def score_mcq_multi(
    student_answer,
    correct_answers: list[str],
    *,
    min_required: int | None = None,
    allow_extra_correct: bool = False,
) -> tuple[bool, set[str]]:
    """Score a multi-correct MCQ.

    Defaults to all-or-nothing: student must pick exactly the correct set.
    With min_required, the student needs that many correct picks and must
    not pick any incorrect option (unless allow_extra_correct is True, in
    which case only min_required correct are needed regardless of extras).
    Returns (is_correct, picked_correct_set).
    """
    picked = _parse_selection(student_answer)
    correct_set = {str(a).strip() for a in correct_answers}
    picked_correct = picked & correct_set
    picked_incorrect = picked - correct_set

    if min_required is None:
        is_correct = picked == correct_set
    else:
        hit_min = len(picked_correct) >= min_required
        if allow_extra_correct:
            is_correct = hit_min and not picked_incorrect
        else:
            is_correct = hit_min and not picked_incorrect
    return is_correct, picked_correct


def picked_error_tags(
    student_answer, options_with_tags: list[dict], correct_answers: list[str]
) -> list[str]:
    """Return the list of error_tags for incorrect options the student picked.

    options_with_tags is the list stored in params.options, where each entry
    is {"value": str, "error_tag": str|None} (or a plain string for legacy).
    """
    picked = _parse_selection(student_answer)
    correct_set = {str(a).strip() for a in correct_answers}
    tags: list[str] = []
    for opt in options_with_tags:
        if isinstance(opt, dict):
            value = str(opt.get("value", "")).strip()
            tag = opt.get("error_tag")
        else:
            value = str(opt).strip()
            tag = None
        if value in picked and value not in correct_set and tag:
            tags.append(tag)
    return tags


def extract_error_tag(input_type: str, student_answer, correct_answer, params: dict) -> str | None:
    """Return a single error_tag describing the student's wrong pick, or None."""
    if input_type == "mcq":
        s = str(student_answer).strip()
        for opt in params.get("options_meta", []) or []:
            if isinstance(opt, dict) and opt.get("value") == s and opt.get("error_tag"):
                return opt["error_tag"]
        return None
    if input_type == "mcq_multi":
        correct = list(correct_answer) if isinstance(correct_answer, list) else [correct_answer]
        tags = picked_error_tags(student_answer, params.get("options_meta", []) or [], correct)
        return tags[0] if tags else None
    if input_type == "binary_equality":
        return params.get("error_tag")
    return None
