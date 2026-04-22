"""Smoke tests for the CEB core-9 generators (issue #110)."""

from __future__ import annotations

import random

import pytest

from src.services.exercise_gen import instantiate
from src.skill_tree.tree import load_templates


def _by_id(templates, id_):
    for t in templates:
        if t["id"] == id_:
            return t
    raise AssertionError(f"template {id_} not found")


@pytest.fixture(scope="module")
def ceb_templates():
    return [t for t in load_templates() if t["id"].startswith("ceb_")]


CEB_TEMPLATE_IDS = [
    "ceb_equality_trap__default",
    "ceb_verification_pick__divide",
    "ceb_verification_pick__multiply",
    "ceb_verification_pick__add",
    "ceb_verification_pick__subtract",
    "ceb_operator_identity__compensation",
    "ceb_operator_identity__inverse",
    "ceb_operator_identity__distributivite",
    "ceb_pick_equivalents__default",
    "ceb_rang_decimal__rank_of_digit",
    "ceb_rang_decimal__place_comma",
    "ceb_inference_from_known__default",
    "ceb_fix_false_equality__default",
]


def test_ceb_templates_all_present(ceb_templates):
    ids = {t["id"] for t in ceb_templates}
    for expected in CEB_TEMPLATE_IDS:
        assert expected in ids, f"missing CEB template {expected}"


@pytest.mark.parametrize("template_id", CEB_TEMPLATE_IDS)
def test_ceb_template_yields_10_distinct_variants(template_id, ceb_templates):
    t = _by_id(ceb_templates, template_id)
    rendered = set()
    attempts = set()
    for seed in range(40):
        random.seed(seed * 101 + 3)
        out = instantiate(t["template"])
        rendered.add(out["prompt"])
        answer = out["answer"]
        if isinstance(answer, list):
            answer = tuple(answer)
        attempts.add((out["prompt"], answer, tuple(out["params"].get("options", [])) or None))
    assert len(attempts) >= 10, f"{template_id}: only {len(attempts)} distinct variants"


class TestEqualityTrap:
    def test_returns_equality_symbol(self):
        t = {
            "type": "equality_trap",
            "params": {
                "pairs": [
                    {
                        "lhs": "{a} − {b}",
                        "rhs": "{b} − {a}",
                        "is_equal": False,
                        "error_tag": "tag",
                        "params": {"a_min": 10, "a_max": 50, "b_min": 1, "b_max": 9},
                    }
                ]
            },
            "prompt_template": "{lhs} ? {rhs}",
        }
        out = instantiate(t)
        assert out["answer"] in {"=", "≠"}
        assert out["params"]["error_tag"] == "tag"


class TestVerificationPick:
    def test_division_correct_option_is_reciprocal(self):
        t = {
            "type": "verification_pick",
            "operation": "divide",
            "params": {"a_min": 10, "a_max": 100, "b_min": 2, "b_max": 5, "exact_division": True},
            "prompt_template": "{a} ÷ {b} = {result} ?",
        }
        for seed in range(20):
            random.seed(seed)
            out = instantiate(t)
            assert out["answer"] in out["params"]["options"]
            assert len(out["params"]["options"]) == 4


class TestOperatorIdentityCompensation:
    def test_compensation_answer_balances(self):
        t = {
            "type": "operator_identity_fill",
            "params": {
                "identity": "compensation_soustraction",
                "a_min": 500,
                "a_max": 900,
                "b_min": 50,
                "b_max": 400,
                "round_to": 100,
            },
            "prompt_template": "{a} − {b} = {round_a} − ?",
        }
        for seed in range(20):
            random.seed(seed)
            out = instantiate(t)
            a = out["params"]["a"]
            b = out["params"]["b"]
            round_a = out["params"]["round_a"]
            assert round_a - out["answer"] == a - b


class TestPickEquivalents:
    def test_answer_is_list_of_at_least_two(self):
        t = {
            "type": "pick_equivalents",
            "params": {
                "a_min": 12,
                "a_max": 18,
                "c_min": 30,
                "c_max": 50,
                "splits": [5, 6, 7, 8, 10],
                "min_required": 2,
            },
            "prompt_template": "coche {a} × {c}",
        }
        for seed in range(20):
            random.seed(seed)
            out = instantiate(t)
            assert isinstance(out["answer"], list)
            assert len(out["answer"]) >= 2
            for ans in out["answer"]:
                assert ans in out["params"]["options"]


class TestRangDecimalPlaceComma:
    def test_answer_string_has_target_digit_at_target_rang(self):
        """String-based check to avoid float precision artifacts."""
        integer_position = {
            "unités": 1,
            "dizaines": 2,
            "centaines": 3,
            "milliers": 4,
            "dizaines de mille": 5,
            "centaines de mille": 6,
        }
        decimal_position = {"dixièmes": 1, "centièmes": 2, "millièmes": 3}

        t = {
            "type": "rang_decimal",
            "params": {
                "mode": "place_comma",
                "length": 6,
                "rangs": ["dizaines", "centaines", "dixièmes", "centièmes"],
            },
            "prompt_template": "{digits} {digit} {rang}",
        }
        for seed in range(20):
            random.seed(seed)
            out = instantiate(t)
            rang = out["params"]["rang"]
            digit = out["params"]["digit"]
            result_str = out["params"]["result_str"]
            int_part, _, dec_part = result_str.partition(",")
            if rang in integer_position:
                pos = integer_position[rang]
                extracted = int(int_part[-pos])
            else:
                pos = decimal_position[rang]
                extracted = int(dec_part[pos - 1])
            assert extracted == digit, (
                f"seed={seed} result={result_str} rang={rang} "
                f"expected digit {digit}, got {extracted}"
            )


class TestInferenceFromKnown:
    def test_scale_0_1_a_divides_by_10(self):
        t = {
            "type": "inference_from_known",
            "params": {
                "a_min": 20,
                "a_max": 20,
                "b_min": 30,
                "b_max": 30,
                "inferences": ["scale_0_1_a"],
            },
            "prompt_template": "{a} × {b} = {base} → {new_a} × {new_b} = ?",
        }
        random.seed(0)
        out = instantiate(t)
        assert out["answer"] == 60.0 or out["answer"] == 60


class TestFixFalseEquality:
    def test_answer_is_one_of_options(self):
        t = {
            "type": "fix_false_equality",
            "params": {
                "operations": ["add", "subtract", "multiply"],
                "a_min": 10,
                "a_max": 50,
                "b_min": 2,
                "b_max": 10,
                "num_true": 3,
            },
            "prompt_template": "pick",
        }
        for seed in range(10):
            random.seed(seed)
            out = instantiate(t)
            assert out["answer"] in out["params"]["options"]
            assert len(out["params"]["options"]) == 4
