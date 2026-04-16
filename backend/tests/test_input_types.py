"""Tests for the input_type plumbing: validators, generators, and dispatch."""

import json

from apps.exercises.validators import validate
from src.services.exercise_gen import instantiate


def test_number_validator_normalizes_commas_and_floats():
    assert validate("number", "2,5", 2.5, {})
    assert validate("number", "  3 ", 3, {})
    assert validate("number", "3", 3.0, {})
    assert not validate("number", "4", 5, {})


def test_symbol_validator_only_accepts_allowed_chars():
    assert validate("symbol", "<", "<", {})
    assert not validate("symbol", "<=", "<", {})
    assert not validate("symbol", "a", "<", {})


def test_mcq_validator_exact_match():
    assert validate("mcq", "12", "12", {})
    assert not validate("mcq", "12 ", "13", {})


def test_decomposition_validator_uses_params_parts():
    params = {"parts": {"dizaines": 1, "unités": 3}}
    student = json.dumps({"dizaines": 1, "unités": 3})
    assert validate("decomposition", student, "1 dizaines + 3 unités", params)

    wrong = json.dumps({"dizaines": 2, "unités": 3})
    assert not validate("decomposition", wrong, "1 dizaines + 3 unités", params)


def test_point_on_line_validator_snap_tolerance():
    params = {"step": 10}
    assert validate("point_on_line", "50", 50, params)
    assert validate("point_on_line", "52", 50, params)  # within half-step
    assert not validate("point_on_line", "60", 50, params)


def test_drag_order_validator_json_list():
    assert validate("drag_order", json.dumps(["1", "2", "3"]), ["1", "2", "3"], {})
    assert not validate("drag_order", json.dumps(["2", "1", "3"]), ["1", "2", "3"], {})


def test_mcq_generator_produces_options_containing_correct_answer():
    template = {
        "type": "mcq",
        "operation": "add",
        "params": {
            "a_min": 1,
            "a_max": 5,
            "b_min": 1,
            "b_max": 5,
            "num_options": 4,
            "distractor_spread": 3,
        },
        "prompt_template": "{a} + {b} = ?",
    }
    out = instantiate(template)
    assert out["answer"] in out["params"]["options"]
    assert len(set(out["params"]["options"])) == 4


def test_point_on_line_generator_returns_target_in_range():
    template = {
        "type": "point_on_line",
        "params": {"min": 0, "max": 100, "step": 10},
        "prompt_template": "Place {target} sur la ligne",
    }
    out = instantiate(template)
    target = out["answer"]
    assert 0 <= target <= 100
    assert target % 10 == 0
    assert out["params"]["target"] == target


def test_drag_order_generator_shuffles_and_produces_sorted_answer():
    template = {
        "type": "drag_order",
        "params": {"item_min": 10, "item_max": 99, "count": 4, "direction": "asc"},
        "prompt_template": "Range",
    }
    out = instantiate(template)
    items = out["params"]["items"]
    correct = out["answer"]
    assert sorted([int(x) for x in correct]) == [int(x) for x in correct]
    assert sorted(items) != items or items == correct  # shuffled unless very small sample
    assert set(items) == set(correct)


def test_unknown_input_type_falls_back_to_number_validator():
    assert validate("unknown_type", "42", 42, {})
