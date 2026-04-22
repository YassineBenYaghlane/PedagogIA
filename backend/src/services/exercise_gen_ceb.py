"""Generators for the CEB core-9 templates (issue #110)."""

from __future__ import annotations

import random
from typing import Any

from .exercise_gen import _clean_number, _format_number, _pick_value, register

MAX_RETRIES = 50


def _format_expr(expr: str, **values) -> str:
    for k, v in values.items():
        expr = expr.replace("{" + k + "}", _format_number(v))
    return expr


def _shuffled_options(correct: str, distractors: list[dict]) -> list[dict]:
    pool = [{"value": correct, "error_tag": None}] + distractors
    random.shuffle(pool)
    return pool


def _mcq_options_and_answer(correct: str, distractors: list[dict]) -> tuple[list[str], list[dict]]:
    opts = _shuffled_options(correct, distractors)
    return [o["value"] for o in opts], opts


# ---------------------------------------------------------------------------
# 1. equality_trap — binary_equality (=/≠)
# ---------------------------------------------------------------------------


@register("equality_trap")
def _gen_equality_trap(template: dict) -> dict[str, Any]:
    params = template["params"]
    pairs = params["pairs"]
    pair = random.choice(pairs)

    p_params = {**params, **pair.get("params", {})}
    a = _pick_value(p_params, "a")
    b = _pick_value(p_params, "b")
    if pair.get("ensure_a_gt_b") and a <= b:
        a, b = max(a, b) + 1, min(a, b)

    lhs = _format_expr(pair["lhs"], a=a, b=b)
    rhs = _format_expr(pair["rhs"], a=a, b=b)
    is_equal = bool(pair["is_equal"])
    answer = "=" if is_equal else "≠"

    prompt = template["prompt_template"].format(lhs=lhs, rhs=rhs)
    return {
        "prompt": prompt,
        "answer": answer,
        "params": {
            "a": a,
            "b": b,
            "lhs": lhs,
            "rhs": rhs,
            "is_equal": is_equal,
            "error_tag": pair.get("error_tag"),
        },
    }


# ---------------------------------------------------------------------------
# 2. verification_pick — mcq
# ---------------------------------------------------------------------------


def _verification_build(operation: str, a, b, result) -> tuple[str, list[dict]]:
    """Return (correct_expr, distractors) for the given operation."""
    fa, fb, fc = _format_number(a), _format_number(b), _format_number(result)
    if operation == "divide":
        correct = f"{fc} × {fb}"
        distractors = [
            {"value": f"{fa} ÷ {fc}", "error_tag": "inverse_numerateur_denominateur"},
            {"value": f"{fa} × {fb}", "error_tag": "repetition_operation"},
            {"value": f"{fc} ÷ {fb}", "error_tag": "division_du_quotient"},
        ]
    elif operation == "multiply":
        correct = f"{fc} ÷ {fb}"
        distractors = [
            {"value": f"{fa} × {fb}", "error_tag": "repetition_operation"},
            {"value": f"{fc} × {fb}", "error_tag": "meme_operation_sur_resultat"},
            {"value": f"{fc} + {fb}", "error_tag": "confusion_addition_multiplication"},
        ]
    elif operation == "add":
        correct = f"{fc} − {fb}"
        distractors = [
            {"value": f"{fa} + {fb}", "error_tag": "repetition_operation"},
            {"value": f"{fc} + {fb}", "error_tag": "meme_operation_sur_resultat"},
            {"value": f"{fa} − {fc}", "error_tag": "inverse_termes"},
        ]
    elif operation == "subtract":
        correct = f"{fc} + {fb}"
        distractors = [
            {"value": f"{fa} − {fb}", "error_tag": "repetition_operation"},
            {"value": f"{fc} − {fb}", "error_tag": "meme_operation_sur_resultat"},
            {"value": f"{fa} + {fc}", "error_tag": "inverse_termes"},
        ]
    else:
        raise ValueError(f"verification_pick: unknown operation {operation}")
    return correct, distractors


@register("verification_pick")
def _gen_verification_pick(template: dict) -> dict[str, Any]:
    params = template["params"]
    operation = template["operation"]

    for _ in range(MAX_RETRIES):
        a = _pick_value(params, "a")
        b = _pick_value(params, "b")

        if operation == "divide":
            if b == 0:
                continue
            if params.get("exact_division"):
                if params.get("fixed_a"):
                    if int(a) % int(b) != 0:
                        continue
                    a, b = int(a), int(b)
                else:
                    a = int(a) * int(b)
                    b = int(b)
        if operation == "subtract" and a < b:
            a, b = b, a

        if operation == "add":
            result = _clean_number(a + b)
        elif operation == "subtract":
            result = _clean_number(a - b)
        elif operation == "multiply":
            result = _clean_number(a * b)
        else:
            result = _clean_number(a / b)

        correct, distractors = _verification_build(operation, a, b, result)
        op_symbol = {"add": "+", "subtract": "−", "multiply": "×", "divide": "÷"}[operation]
        prompt = template["prompt_template"].format(
            a=_format_number(a),
            b=_format_number(b),
            result=_format_number(result),
            op=op_symbol,
        )
        options_values, options_meta = _mcq_options_and_answer(correct, distractors)
        return {
            "prompt": prompt,
            "answer": correct,
            "params": {
                "a": a,
                "b": b,
                "result": result,
                "options": options_values,
                "options_meta": options_meta,
            },
        }

    raise RuntimeError("verification_pick: could not satisfy constraints")


# ---------------------------------------------------------------------------
# 3. operator_identity_fill — number input (variant-driven)
# ---------------------------------------------------------------------------


@register("operator_identity_fill")
def _gen_operator_identity_fill(template: dict) -> dict[str, Any]:
    params = template["params"]
    identity = params["identity"]

    if identity == "compensation_soustraction":
        # a − b = round_up(a) − x → x = round_up(a) − (a − b) = round_up(a) − a + b
        step = params.get("round_to", 100)
        a = _pick_value(params, "a")
        b = _pick_value(params, "b")
        if a <= b:
            a = b + step
        round_a = ((int(a) // step) + 1) * step
        answer = _clean_number(round_a - a + b)
        prompt = template["prompt_template"].format(
            a=_format_number(a), b=_format_number(b), round_a=_format_number(round_a)
        )
        return {
            "prompt": prompt,
            "answer": answer,
            "params": {"a": a, "b": b, "round_a": round_a},
        }

    if identity == "inverse_multiplicatif":
        # a ÷ k = a × ___  where k in {0.1, 0.5, 0.25}
        pairs = {0.1: 10, 0.5: 2, 0.25: 4}
        divisors = params.get("divisors", [0.1, 0.5, 0.25])
        k = random.choice(divisors)
        a = _pick_value(params, "a")
        answer = pairs[k]
        prompt = template["prompt_template"].format(a=_format_number(a), k=_format_number(k))
        return {"prompt": prompt, "answer": answer, "params": {"a": a, "k": k}}

    if identity == "distributivite_unitaire":
        # n × b = ((n+1) × b) − b  → answer = n+1
        n = _pick_value(params, "n")
        b = _pick_value(params, "b")
        answer = _clean_number(n + 1)
        prompt = template["prompt_template"].format(n=_format_number(n), b=_format_number(b))
        return {"prompt": prompt, "answer": answer, "params": {"n": n, "b": b}}

    if identity == "distributivite_somme":
        # a × (b + c) = (a × b) + ___  → answer = a × c
        a = _pick_value(params, "a")
        b = _pick_value(params, "b")
        c = _pick_value(params, "c")
        answer = _clean_number(a * c)
        prompt = template["prompt_template"].format(
            a=_format_number(a), b=_format_number(b), c=_format_number(c)
        )
        return {"prompt": prompt, "answer": answer, "params": {"a": a, "b": b, "c": c}}

    raise ValueError(f"operator_identity_fill: unknown identity {identity}")


# ---------------------------------------------------------------------------
# 4. pick_equivalents — mcq_multi
# ---------------------------------------------------------------------------


def _factor_pairs(n: int) -> list[tuple[int, int]]:
    """Return integer factor pairs (p, q) with p <= q, p >= 2."""
    out = []
    for p in range(2, int(n**0.5) + 1):
        if n % p == 0:
            out.append((p, n // p))
    return out


@register("pick_equivalents")
def _gen_pick_equivalents(template: dict) -> dict[str, Any]:
    """a × c variant: two correct decompositions (distributivity, commutativity)
    plus two incorrect distractors with error_tags.
    """
    params = template["params"]

    for _ in range(MAX_RETRIES):
        a = _pick_value(params, "a")
        c = _pick_value(params, "c")
        splits = params.get("splits")
        if splits:
            split_candidates = [s for s in splits if 0 < s < a and s * 2 != a]
        else:
            split_candidates = [s for s in range(2, int(a)) if s * 2 != a]
        if not split_candidates:
            continue
        p = random.choice(split_candidates)
        q = a - p

        options = [
            {
                "value": f"({_format_number(p)} × {_format_number(c)}) + "
                f"({_format_number(q)} × {_format_number(c)})",
                "is_correct": True,
                "error_tag": None,
            },
            {
                "value": f"{_format_number(c)} × {_format_number(a)}",
                "is_correct": True,
                "error_tag": None,
            },
            {
                "value": f"({_format_number(p)} × {_format_number(c)}) + "
                f"({_format_number(p)} × {_format_number(c)})",
                "is_correct": False,
                "error_tag": "duplication_au_lieu_de_complement",
            },
        ]
        k = params.get("wrong_delta", 10)
        options.append(
            {
                "value": f"({_format_number(p)} × {_format_number(c + k)}) + "
                f"({_format_number(q)} × {_format_number(c)})",
                "is_correct": False,
                "error_tag": "deux_facteurs_differents",
            }
        )
        factor_pairs = _factor_pairs(int(c))
        if factor_pairs:
            fp = random.choice(factor_pairs)
            options.append(
                {
                    "value": f"{_format_number(a)} × {_format_number(fp[0])} × "
                    f"{_format_number(fp[1])}",
                    "is_correct": True,
                    "error_tag": None,
                }
            )
        else:
            options.append(
                {
                    "value": f"{_format_number(a)} × {_format_number(c + 1)}",
                    "is_correct": False,
                    "error_tag": "ajout_a_un_facteur",
                }
            )

        random.shuffle(options)
        correct_values = [o["value"] for o in options if o["is_correct"]]
        options_values = [o["value"] for o in options]
        options_meta = [{"value": o["value"], "error_tag": o["error_tag"]} for o in options]
        prompt = template["prompt_template"].format(a=_format_number(a), c=_format_number(c))
        return {
            "prompt": prompt,
            "answer": correct_values,
            "params": {
                "a": a,
                "c": c,
                "options": options_values,
                "options_meta": options_meta,
                "correct_values": correct_values,
                "min_required": params.get("min_required", len(correct_values)),
            },
        }

    raise RuntimeError("pick_equivalents: could not build options")


# ---------------------------------------------------------------------------
# 5. rang_decimal — two sub-modes (integer rank = MCQ; decimal place = number)
# ---------------------------------------------------------------------------


RANGS = {
    "unités": 1,
    "dizaines": 10,
    "centaines": 100,
    "milliers": 1000,
    "dizaines de mille": 10000,
    "centaines de mille": 100000,
    "millions": 1000000,
    "dixièmes": 0.1,
    "centièmes": 0.01,
    "millièmes": 0.001,
}


def _number_with_unique_digits(length: int, allow_zero: bool = False) -> int:
    digits = list(range(1 if not allow_zero else 0, 10))
    random.shuffle(digits)
    picked = digits[:length]
    if picked[0] == 0:
        picked[0], picked[1] = picked[1], picked[0]
    return int("".join(str(d) for d in picked))


def _digit_at_rang(number: int | float, rang_label: str) -> int:
    value = RANGS[rang_label]
    if value >= 1:
        return (int(number) // int(value)) % 10
    # decimal rang
    scaled = round(number / value)
    return int(scaled) % 10


def _french_int_spaced(n: int) -> str:
    s = str(n)
    groups = []
    while s:
        groups.append(s[-3:])
        s = s[:-3]
    return " ".join(reversed(groups))


@register("rang_decimal")
def _gen_rang_decimal(template: dict) -> dict[str, Any]:
    params = template["params"]
    mode = params["mode"]
    if mode == "rank_of_digit":
        rangs = params["rangs"]
        length = params.get("length", 6)
        for _ in range(MAX_RETRIES):
            integer_part = _number_with_unique_digits(length)
            decimals = params.get("decimals", 0)
            if decimals > 0:
                dec_part = _number_with_unique_digits(decimals, allow_zero=True)
                number_value = integer_part + dec_part / (10**decimals)
            else:
                number_value = integer_part
            chosen_rang = random.choice(rangs)
            digit = _digit_at_rang(number_value, chosen_rang)
            if digit == 0:
                continue
            display = _french_int_spaced(integer_part)
            if decimals > 0:
                display = f"{display},{str(dec_part).zfill(decimals)}"
            distractor_rangs = [r for r in rangs if r != chosen_rang]
            random.shuffle(distractor_rangs)
            distractor_rangs = distractor_rangs[:3]
            options = [chosen_rang] + distractor_rangs
            random.shuffle(options)
            options_meta = [
                {
                    "value": r,
                    "error_tag": None
                    if r == chosen_rang
                    else f"confusion_rang_{r.replace(' ', '_')}",
                }
                for r in options
            ]
            prompt = template["prompt_template"].format(number=display, digit=digit)
            return {
                "prompt": prompt,
                "answer": chosen_rang,
                "params": {
                    "number": display,
                    "digit": digit,
                    "chosen_rang": chosen_rang,
                    "options": options,
                    "options_meta": options_meta,
                },
            }
        raise RuntimeError("rang_decimal: could not find unique-digit number")

    if mode == "place_comma":
        rangs = params["rangs"]
        length = params.get("length", 6)
        for _ in range(MAX_RETRIES):
            integer_src = _number_with_unique_digits(length)
            digits = str(integer_src)
            chosen_rang = random.choice(rangs)
            rang_value = RANGS[chosen_rang]
            import math

            if rang_value >= 1:
                k = int(round(math.log10(rang_value)))
                i_max = len(digits) - k - 2
                i_min = 0
            else:
                m = int(round(-math.log10(rang_value)))
                i_min = m
                i_max = len(digits) - 1
            if i_min < 0:
                i_min = 0
            if i_max < i_min:
                continue
            i = random.randint(i_min, i_max)
            chosen_digit = int(digits[i])
            if chosen_digit == 0:
                continue
            if rang_value >= 1:
                comma_pos = i + k + 1
            else:
                comma_pos = i - m + 1
            if comma_pos <= 0 or comma_pos >= len(digits):
                continue
            result_str = digits[:comma_pos] + "," + digits[comma_pos:]
            result_value = float(result_str.replace(",", "."))
            prompt = template["prompt_template"].format(
                digits=digits, rang=chosen_rang, digit=chosen_digit
            )
            return {
                "prompt": prompt,
                "answer": _clean_number(result_value),
                "params": {
                    "digits": digits,
                    "rang": chosen_rang,
                    "digit": chosen_digit,
                    "result_str": result_str,
                },
            }
        raise RuntimeError("rang_decimal place_comma: could not satisfy constraints")

    raise ValueError(f"rang_decimal: unknown mode {mode}")


# ---------------------------------------------------------------------------
# 7. inference_from_known — number (chained fact)
# ---------------------------------------------------------------------------


@register("inference_from_known")
def _gen_inference_from_known(template: dict) -> dict[str, Any]:
    params = template["params"]
    inferences = params["inferences"]

    a = _pick_value(params, "a")
    b = _pick_value(params, "b")
    base = _clean_number(a * b)

    inference = random.choice(inferences)

    if inference == "scale_0_1_a":
        new_a = _clean_number(a / 10)
        answer = _clean_number(new_a * b)
        new_a_fmt, new_b_fmt = _format_number(new_a), _format_number(b)
    elif inference == "scale_10_a":
        new_a = _clean_number(a * 10)
        answer = _clean_number(new_a * b)
        new_a_fmt, new_b_fmt = _format_number(new_a), _format_number(b)
    elif inference == "double_a":
        new_a = _clean_number(a * 2)
        answer = _clean_number(new_a * b)
        new_a_fmt, new_b_fmt = _format_number(new_a), _format_number(b)
    elif inference == "plus_one_a":
        new_a = _clean_number(a + 1)
        answer = _clean_number(new_a * b)
        new_a_fmt, new_b_fmt = _format_number(new_a), _format_number(b)
    elif inference == "scale_0_1_b":
        new_b = _clean_number(b / 10)
        answer = _clean_number(a * new_b)
        new_a_fmt, new_b_fmt = _format_number(a), _format_number(new_b)
    else:
        raise ValueError(f"inference_from_known: unknown inference {inference}")

    prompt = template["prompt_template"].format(
        a=_format_number(a),
        b=_format_number(b),
        base=_format_number(base),
        new_a=new_a_fmt,
        new_b=new_b_fmt,
    )
    return {
        "prompt": prompt,
        "answer": answer,
        "params": {
            "a": a,
            "b": b,
            "base": base,
            "inference": inference,
            "new_a": new_a_fmt,
            "new_b": new_b_fmt,
        },
    }


# ---------------------------------------------------------------------------
# 8. fix_false_equality — mcq (pick the false equality)
# ---------------------------------------------------------------------------


def _make_equality(operation: str, params: dict) -> tuple[str, int | float]:
    """Return (display string like 'a + b = c', numeric result) for a random (a, b)."""
    a = _pick_value(params, "a")
    b = _pick_value(params, "b")
    if operation == "subtract" and a < b:
        a, b = b, a
    if operation == "divide":
        if params.get("exact_division", True):
            a = int(a) * int(b)
            b = int(b)
    if operation == "add":
        c = _clean_number(a + b)
        expr = f"{_format_number(a)} + {_format_number(b)} = {_format_number(c)}"
    elif operation == "subtract":
        c = _clean_number(a - b)
        expr = f"{_format_number(a)} − {_format_number(b)} = {_format_number(c)}"
    elif operation == "multiply":
        c = _clean_number(a * b)
        expr = f"{_format_number(a)} × {_format_number(b)} = {_format_number(c)}"
    else:
        c = _clean_number(a / b)
        expr = f"{_format_number(a)} ÷ {_format_number(b)} = {_format_number(c)}"
    return expr, c


def _make_false_equality(operation: str, params: dict) -> tuple[str, dict]:
    params_loc = dict(params)
    params_loc.setdefault("a_min", params.get("a_min", 5))
    a = _pick_value(params_loc, "a")
    b = _pick_value(params_loc, "b")
    if operation == "subtract" and a < b:
        a, b = b, a
    if operation == "divide":
        a = int(a) * int(b)
        b = int(b)
    if operation == "add":
        correct = _clean_number(a + b)
        symbol = "+"
    elif operation == "subtract":
        correct = _clean_number(a - b)
        symbol = "−"
    elif operation == "multiply":
        correct = _clean_number(a * b)
        symbol = "×"
    else:
        correct = _clean_number(a / b)
        symbol = "÷"

    delta = random.choice([-3, -2, -1, 1, 2, 3])
    wrong = _clean_number(correct + delta)
    if wrong == correct or wrong < 0:
        wrong = _clean_number(correct + (2 if delta > 0 else -2))
    expr = f"{_format_number(a)} {symbol} {_format_number(b)} = {_format_number(wrong)}"
    return expr, {
        "a": a,
        "b": b,
        "operation": operation,
        "correct": correct,
        "wrong": wrong,
        "delta": delta,
        "error_tag": f"off_by_{abs(delta)}_{'plus' if delta > 0 else 'moins'}_{operation}",
    }


@register("fix_false_equality")
def _gen_fix_false_equality(template: dict) -> dict[str, Any]:
    params = template["params"]
    operations = params["operations"]
    num_true = params.get("num_true", 3)

    for _ in range(MAX_RETRIES):
        false_op = random.choice(operations)
        false_expr, false_meta = _make_false_equality(false_op, params)

        true_entries: list[tuple[str, int | float]] = []
        seen = {false_expr}
        attempts = 0
        while len(true_entries) < num_true and attempts < 40:
            attempts += 1
            t_op = random.choice(operations)
            expr, _c = _make_equality(t_op, params)
            if expr not in seen:
                true_entries.append((expr, _c))
                seen.add(expr)
        if len(true_entries) < num_true:
            continue

        all_options = [
            {"value": false_expr, "is_correct": True, "error_tag": false_meta["error_tag"]}
        ] + [{"value": e, "is_correct": False, "error_tag": None} for e, _ in true_entries]
        random.shuffle(all_options)
        options_values = [o["value"] for o in all_options]
        options_meta = [{"value": o["value"], "error_tag": o["error_tag"]} for o in all_options]
        prompt = template["prompt_template"]
        return {
            "prompt": prompt,
            "answer": false_expr,
            "params": {
                "options": options_values,
                "options_meta": options_meta,
                "false_operation": false_meta["operation"],
                "correct_value": false_meta["correct"],
                "wrong_value": false_meta["wrong"],
            },
        }

    raise RuntimeError("fix_false_equality: could not build options")
