"""Exercise instantiation service — generates concrete exercises from templates."""

from __future__ import annotations

import random
from typing import Any

_GENERATORS: dict[str, callable] = {}

MAX_RETRIES = 50


def register(type_name: str):
    """Decorator to register a generator function for a template type."""

    def decorator(fn):
        _GENERATORS[type_name] = fn
        return fn

    return decorator


def instantiate(template: dict[str, Any]) -> dict[str, Any]:
    """Generate a concrete exercise from a template dict."""
    gen = _GENERATORS.get(template["type"])
    if not gen:
        raise ValueError(f"Unknown template type: {template['type']}")
    return gen(template)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _pick_value(params: dict, prefix: str) -> int | float:
    """Pick a random value for operand `prefix` (e.g. 'a' or 'b').

    Supports fixed_{prefix} list or {prefix}_min/{prefix}_max range.
    Respects 'decimals' param for decimal precision.
    """
    fixed = params.get(f"fixed_{prefix}")
    if fixed:
        base = random.choice(fixed)
    else:
        lo = params[f"{prefix}_min"]
        hi = params[f"{prefix}_max"]
        decimals = params.get("decimals", 0)
        if decimals > 0:
            factor = 10**decimals
            base = random.randint(int(lo * factor), int(hi * factor)) / factor
        else:
            base = random.randint(lo, hi)
    return base


def _compute(operation: str, a: float, b: float) -> float:
    ops = {
        "add": a + b,
        "subtract": a - b,
        "multiply": a * b,
        "divide": a / b if b != 0 else 0,
    }
    result = ops[operation]
    return _clean_number(result)


def _clean_number(n: float) -> int | float:
    """Return int if whole number, else rounded float."""
    if isinstance(n, float) and n == int(n):
        return int(n)
    if isinstance(n, float):
        return round(n, 6)
    return n


def _has_carry(a: int, b: int) -> bool:
    """Check if addition a + b requires at least one carry."""
    while a > 0 or b > 0:
        if (a % 10) + (b % 10) >= 10:
            return True
        a //= 10
        b //= 10
    return False


def _has_borrow(a: int, b: int) -> bool:
    """Check if subtraction a - b requires at least one borrow."""
    while a > 0 or b > 0:
        if (a % 10) < (b % 10):
            return True
        a //= 10
        b //= 10
    return False


def _format_number(n: int | float) -> str:
    """Format number for display (French convention: comma for decimals)."""
    if isinstance(n, int):
        return str(n)
    s = f"{n:g}"
    return s.replace(".", ",")


# ---------------------------------------------------------------------------
# Generators
# ---------------------------------------------------------------------------


@register("computation")
def _generate_computation(template: dict) -> dict[str, Any]:
    params = template["params"]
    operation = template["operation"]

    for _ in range(MAX_RETRIES):
        a = _pick_value(params, "a")
        if params.get("fixed_b_equals_a"):
            b = a
        else:
            b = _pick_value(params, "b")

        if params.get("result_non_negative") and operation == "subtract":
            a, b = max(a, b), min(a, b)
            if a == b and params.get("a_min", 0) > 0:
                continue

        if params.get("exact_division") and operation == "divide":
            q = _pick_value(params, "b")
            d = _pick_value(params, "a")
            if d == 0:
                continue
            a = int(d * q)
            b = int(d)

        result = _compute(operation, a, b)

        if params.get("result_max") and result > params["result_max"]:
            continue
        if params.get("result_min") is not None and result < params["result_min"]:
            continue
        if params.get("requires_carry") and not _has_carry(int(a), int(b)):
            continue
        if params.get("no_carry") and _has_carry(int(a), int(b)):
            continue
        if params.get("requires_borrow") and not _has_borrow(int(a), int(b)):
            continue
        if params.get("no_borrow") and _has_borrow(int(a), int(b)):
            continue

        prompt = template["prompt_template"].format(a=_format_number(a), b=_format_number(b))
        return {"prompt": prompt, "answer": result, "params": {"a": a, "b": b}}

    raise RuntimeError(f"Could not satisfy constraints after {MAX_RETRIES} retries")


@register("fill_blank")
def _generate_fill_blank(template: dict) -> dict[str, Any]:
    """Generate a fill-in-the-blank exercise.

    Supports two modes via params:
    - 'sequence' mode: complete a number sequence with a gap
    - 'missing_operand' mode: a OP ? = c
    """
    params = template["params"]
    mode = params.get("mode", "missing_operand")

    if mode == "sequence":
        return _fill_blank_sequence(template)
    return _fill_blank_operand(template)


def _fill_blank_sequence(template: dict) -> dict[str, Any]:
    params = template["params"]
    start_min = params.get("start_min", 1)
    start_max = params.get("start_max", 20)
    step = params.get("step", 1)
    length = params.get("length", 5)

    start = random.randint(start_min, start_max)
    sequence = [start + i * step for i in range(length)]
    gap_idx = random.randint(1, length - 2)
    answer = sequence[gap_idx]
    display = [_format_number(n) if i != gap_idx else "?" for i, n in enumerate(sequence)]

    prompt = template["prompt_template"].format(sequence=" , ".join(display))
    params = {"sequence": sequence, "gap_index": gap_idx}
    return {"prompt": prompt, "answer": answer, "params": params}


def _fill_blank_operand(template: dict) -> dict[str, Any]:
    params = template["params"]
    operation = template.get("operation", "add")

    for _ in range(MAX_RETRIES):
        a = _pick_value(params, "a")
        b = _pick_value(params, "b")
        result = _compute(operation, a, b)

        if params.get("result_max") and result > params["result_max"]:
            continue
        if params.get("result_min") is not None and result < params["result_min"]:
            continue
        if params.get("result_non_negative") and result < 0:
            continue

        position = params.get("blank_position", "b")
        if position == "b":
            prompt = template["prompt_template"].format(
                a=_format_number(a), result=_format_number(result)
            )
            return {"prompt": prompt, "answer": b, "params": {"a": a, "b": b, "result": result}}
        else:
            prompt = template["prompt_template"].format(
                b=_format_number(b), result=_format_number(result)
            )
            return {"prompt": prompt, "answer": a, "params": {"a": a, "b": b, "result": result}}

    raise RuntimeError(f"Could not satisfy constraints after {MAX_RETRIES} retries")


@register("comparison")
def _generate_comparison(template: dict) -> dict[str, Any]:
    """Generate a comparison exercise: a ? b → student fills <, >, or =."""
    params = template["params"]
    a = _pick_value(params, "a")
    b = _pick_value(params, "b")

    if a > b:
        answer = ">"
    elif a < b:
        answer = "<"
    else:
        answer = "="

    prompt = template["prompt_template"].format(a=_format_number(a), b=_format_number(b))
    return {"prompt": prompt, "answer": answer, "params": {"a": a, "b": b}}


@register("decomposition")
def _generate_decomposition(template: dict) -> dict[str, Any]:
    """Generate a place-value decomposition exercise."""
    params = template["params"]
    target = random.randint(params["target_min"], params["target_max"])

    places = params.get("places", ["dizaines", "unités"])
    parts = _decompose_number(target, places)
    parts_display = " + ".join(f"{v} {label}" for label, v in zip(places, parts) if v > 0)

    prompt = template["prompt_template"].format(n=_format_number(target), parts=parts_display)

    answer_key = template.get("answer_key", "parts")
    if answer_key == "target":
        answer = target
    else:
        answer = parts_display

    parts_dict = dict(zip(places, parts))
    return {"prompt": prompt, "answer": answer, "params": {"target": target, "parts": parts_dict}}


def _decompose_number(n: int, places: list[str]) -> list[int]:
    """Decompose a number into place values."""
    place_values = {
        "milliards": 1_000_000_000,
        "millions": 1_000_000,
        "centaines de mille": 100_000,
        "dizaines de mille": 10_000,
        "milliers": 1000,
        "centaines": 100,
        "dizaines": 10,
        "unités": 1,
    }
    parts = []
    remainder = n
    for place in places:
        pv = place_values.get(place, 1)
        digit = remainder // pv
        remainder = remainder % pv
        parts.append(digit)
    return parts


@register("estimation")
def _generate_estimation(template: dict) -> dict[str, Any]:
    """Generate an estimation/rounding exercise."""
    params = template["params"]
    operation = template.get("operation")
    round_to = params.get("round_to", 10)

    a = _pick_value(params, "a")
    b = _pick_value(params, "b") if "b_min" in params else None

    if b is not None and operation:
        exact = _compute(operation, a, b)
        rounded_a = round(a / round_to) * round_to
        rounded_b = round(b / round_to) * round_to
        answer = _clean_number(_compute(operation, rounded_a, rounded_b))
        prompt = template["prompt_template"].format(a=_format_number(a), b=_format_number(b))
        params = {"a": a, "b": b, "exact": exact, "estimate": answer}
        return {"prompt": prompt, "answer": answer, "params": params}
    else:
        answer = _clean_number(round(a / round_to) * round_to)
        prompt = template["prompt_template"].format(a=_format_number(a))
        return {"prompt": prompt, "answer": answer, "params": {"a": a, "rounded": answer}}


@register("mcq")
def _generate_mcq(template: dict) -> dict[str, Any]:
    """Generate a multiple-choice question from a computation.

    Params: operation, a_min/a_max, b_min/b_max, num_options (default 4),
    distractor_spread (default 3). Emits params.options (strings) + answer string.
    """
    params = template["params"]
    operation = template.get("operation", "add")
    num_options = params.get("num_options", 4)
    spread = params.get("distractor_spread", 3)

    a = _pick_value(params, "a")
    b = _pick_value(params, "b")
    if operation == "subtract" and params.get("result_non_negative") and a < b:
        a, b = b, a
    correct = _compute(operation, a, b)

    distractors: set[int | float] = set()
    attempts = 0
    while len(distractors) < num_options - 1 and attempts < 50:
        delta = random.randint(-spread, spread)
        if delta == 0:
            attempts += 1
            continue
        candidate = _clean_number(correct + delta)
        if candidate != correct and candidate >= 0:
            distractors.add(candidate)
        attempts += 1

    options = [_format_number(correct)] + [_format_number(d) for d in distractors]
    random.shuffle(options)
    prompt = template["prompt_template"].format(a=_format_number(a), b=_format_number(b))
    return {
        "prompt": prompt,
        "answer": _format_number(correct),
        "params": {"a": a, "b": b, "options": options},
    }


@register("point_on_line")
def _generate_point_on_line(template: dict) -> dict[str, Any]:
    """Generate a 'place the number on the line' exercise."""
    params = template["params"]
    lo = params["min"]
    hi = params["max"]
    step = params.get("step", 1)
    target_values = list(range(lo, hi + 1, step))
    target = random.choice(target_values)
    prompt = template["prompt_template"].format(target=_format_number(target))
    return {
        "prompt": prompt,
        "answer": target,
        "params": {"min": lo, "max": hi, "step": step, "target": target},
    }


@register("drag_order")
def _generate_drag_order(template: dict) -> dict[str, Any]:
    """Generate a drag-to-order exercise (ascending or descending)."""
    params = template["params"]
    direction = params.get("direction", "asc")
    count = params.get("count", 4)

    fixed = params.get("fixed_items")
    if fixed:
        items = list(random.sample(fixed, min(count, len(fixed))))
    else:
        lo = params["item_min"]
        hi = params["item_max"]
        pool = list(range(lo, hi + 1))
        items = random.sample(pool, count)

    correct = sorted(items, reverse=(direction == "desc"))
    shuffled = list(correct)
    while shuffled == correct:
        random.shuffle(shuffled)

    correct_str = [str(x) for x in correct]
    items_str = [str(x) for x in shuffled]
    prompt = template["prompt_template"]
    return {
        "prompt": prompt,
        "answer": correct_str,
        "params": {"items": items_str, "correct_order": correct_str, "direction": direction},
    }


@register("missing_operator")
def _generate_missing_operator(template: dict) -> dict[str, Any]:
    """Generate a ? b = c → find the operator."""
    params = template["params"]
    operators = params.get("operators", ["+", "-", "×", "÷"])
    op_map = {"+": "add", "-": "subtract", "×": "multiply", "÷": "divide"}

    for _ in range(MAX_RETRIES):
        chosen_symbol = random.choice(operators)
        operation = op_map[chosen_symbol]
        a = _pick_value(params, "a")
        b = _pick_value(params, "b")

        if operation == "divide" and b == 0:
            continue
        if operation == "subtract" and a < b:
            a, b = b, a

        result = _compute(operation, a, b)

        if operation == "divide" and result != int(result):
            continue
        if params.get("result_max") and result > params["result_max"]:
            continue

        prompt = template["prompt_template"].format(
            a=_format_number(a), b=_format_number(b), result=_format_number(result)
        )
        params = {"a": a, "b": b, "result": result, "operator": chosen_symbol}
        return {"prompt": prompt, "answer": chosen_symbol, "params": params}

    raise RuntimeError(f"Could not satisfy constraints after {MAX_RETRIES} retries")
