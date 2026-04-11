from __future__ import annotations

import pytest

from app.services.exercise_gen import instantiate


def _make_template(
    type_: str, operation: str | None = None, params: dict | None = None, **kwargs
) -> dict:
    base = {
        "type": type_,
        "operation": operation,
        "params": params or {},
        "prompt_template": kwargs.get("prompt_template", "{a} + {b} = ?"),
    }
    base.update(kwargs)
    return base


class TestComputation:
    def test_basic_addition(self):
        t = _make_template(
            "computation",
            "add",
            {"a_min": 1, "a_max": 10, "b_min": 1, "b_max": 10},
            prompt_template="{a} + {b} = ?",
        )
        result = instantiate(t)
        assert result["answer"] == result["params"]["a"] + result["params"]["b"]
        assert "+" in result["prompt"]

    def test_subtraction_non_negative(self):
        t = _make_template(
            "computation",
            "subtract",
            {"a_min": 1, "a_max": 20, "b_min": 1, "b_max": 20, "result_non_negative": True},
            prompt_template="{a} - {b} = ?",
        )
        for _ in range(50):
            result = instantiate(t)
            assert result["answer"] >= 0

    def test_requires_carry(self):
        t = _make_template(
            "computation",
            "add",
            {"a_min": 10, "a_max": 99, "b_min": 10, "b_max": 99, "requires_carry": True},
            prompt_template="{a} + {b} = ?",
        )
        for _ in range(50):
            result = instantiate(t)
            a, b = result["params"]["a"], result["params"]["b"]
            has_carry = False
            while a > 0 or b > 0:
                if (a % 10) + (b % 10) >= 10:
                    has_carry = True
                    break
                a //= 10
                b //= 10
            assert has_carry

    def test_no_carry(self):
        t = _make_template(
            "computation",
            "add",
            {"a_min": 10, "a_max": 44, "b_min": 10, "b_max": 44, "no_carry": True},
            prompt_template="{a} + {b} = ?",
        )
        for _ in range(50):
            result = instantiate(t)
            a, b = result["params"]["a"], result["params"]["b"]
            while a > 0 or b > 0:
                assert (a % 10) + (b % 10) < 10
                a //= 10
                b //= 10

    def test_exact_division(self):
        t = _make_template(
            "computation",
            "divide",
            {"a_min": 2, "a_max": 10, "b_min": 2, "b_max": 10, "exact_division": True},
            prompt_template="{a} ÷ {b} = ?",
        )
        for _ in range(50):
            result = instantiate(t)
            assert result["answer"] == int(result["answer"])

    def test_result_max(self):
        t = _make_template(
            "computation",
            "add",
            {"a_min": 1, "a_max": 9, "b_min": 1, "b_max": 9, "result_max": 10},
            prompt_template="{a} + {b} = ?",
        )
        for _ in range(50):
            result = instantiate(t)
            assert result["answer"] <= 10

    def test_fixed_a(self):
        t = _make_template(
            "computation",
            "multiply",
            {"fixed_a": [2, 5, 10], "b_min": 1, "b_max": 10},
            prompt_template="{a} × {b} = ?",
        )
        for _ in range(50):
            result = instantiate(t)
            assert result["params"]["a"] in [2, 5, 10]

    def test_decimals(self):
        t = _make_template(
            "computation",
            "add",
            {"a_min": 1, "a_max": 50, "b_min": 1, "b_max": 50, "decimals": 2},
            prompt_template="{a} + {b} = ?",
        )
        result = instantiate(t)
        a = result["params"]["a"]
        assert isinstance(a, float) or isinstance(a, int)


class TestFillBlank:
    def test_sequence_mode(self):
        t = _make_template(
            "fill_blank",
            None,
            {"mode": "sequence", "start_min": 1, "start_max": 10, "step": 2, "length": 5},
            prompt_template="Complète : {sequence}",
        )
        result = instantiate(t)
        seq = result["params"]["sequence"]
        assert len(seq) == 5
        for i in range(1, len(seq)):
            assert seq[i] - seq[i - 1] == 2
        gap = result["params"]["gap_index"]
        assert result["answer"] == seq[gap]

    def test_missing_operand(self):
        t = _make_template(
            "fill_blank",
            "add",
            {"a_min": 1, "a_max": 10, "b_min": 1, "b_max": 10, "blank_position": "b"},
            prompt_template="{a} + ? = {result}",
        )
        result = instantiate(t)
        assert result["answer"] == result["params"]["b"]
        assert result["params"]["a"] + result["params"]["b"] == result["params"]["result"]


class TestComparison:
    def test_produces_valid_symbol(self):
        t = _make_template(
            "comparison",
            None,
            {"a_min": 1, "a_max": 100, "b_min": 1, "b_max": 100},
            prompt_template="{a} ? {b}",
        )
        for _ in range(50):
            result = instantiate(t)
            assert result["answer"] in ("<", ">", "=")
            a, b = result["params"]["a"], result["params"]["b"]
            if a > b:
                assert result["answer"] == ">"
            elif a < b:
                assert result["answer"] == "<"
            else:
                assert result["answer"] == "="


class TestDecomposition:
    def test_basic(self):
        t = _make_template(
            "decomposition",
            None,
            {"target_min": 10, "target_max": 99, "places": ["dizaines", "unités"]},
            prompt_template="{n} = {parts}",
            answer_key="target",
        )
        result = instantiate(t)
        target = result["params"]["target"]
        assert 10 <= target <= 99
        assert result["params"]["parts"]["dizaines"] == target // 10
        assert result["params"]["parts"]["unités"] == target % 10
        assert result["answer"] == target


class TestEstimation:
    def test_rounding(self):
        t = _make_template(
            "estimation",
            None,
            {"a_min": 11, "a_max": 99, "round_to": 10},
            prompt_template="Arrondis {a} à la dizaine",
        )
        result = instantiate(t)
        a = result["params"]["a"]
        expected = round(a / 10) * 10
        assert result["answer"] == expected

    def test_estimate_operation(self):
        t = _make_template(
            "estimation",
            "add",
            {"a_min": 10, "a_max": 99, "b_min": 10, "b_max": 99, "round_to": 10},
            prompt_template="Estime {a} + {b}",
        )
        result = instantiate(t)
        a, b = result["params"]["a"], result["params"]["b"]
        expected = round(a / 10) * 10 + round(b / 10) * 10
        assert result["answer"] == expected


class TestMissingOperator:
    def test_finds_operator(self):
        t = _make_template(
            "missing_operator",
            None,
            {"a_min": 2, "a_max": 10, "b_min": 2, "b_max": 10, "operators": ["+", "-", "×"]},
            prompt_template="{a} ? {b} = {result}",
        )
        for _ in range(50):
            result = instantiate(t)
            assert result["answer"] in ("+", "-", "×")


class TestErrors:
    def test_unknown_type(self):
        with pytest.raises(ValueError, match="Unknown template type"):
            instantiate({"type": "bogus"})
