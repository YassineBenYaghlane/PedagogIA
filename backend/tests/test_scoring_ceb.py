"""Tests for the multi-correct MCQ scorer and error_tag extraction (issue #110)."""

import json

from apps.exercises.scoring import extract_error_tag, picked_error_tags, score_mcq_multi


class TestScoreMcqMulti:
    def test_all_correct_picked_is_correct(self):
        ok, picked = score_mcq_multi(["A", "B"], ["A", "B"])
        assert ok
        assert picked == {"A", "B"}

    def test_partial_pick_is_wrong(self):
        ok, _ = score_mcq_multi(["A"], ["A", "B"])
        assert not ok

    def test_extra_incorrect_pick_is_wrong(self):
        ok, _ = score_mcq_multi(["A", "B", "C"], ["A", "B"])
        assert not ok

    def test_json_encoded_selection(self):
        ok, _ = score_mcq_multi(json.dumps(["A", "B"]), ["A", "B"])
        assert ok

    def test_comma_separated_selection_fallback(self):
        ok, _ = score_mcq_multi("A, B", ["A", "B"])
        assert ok

    def test_min_required_allows_partial(self):
        ok, _ = score_mcq_multi(["A"], ["A", "B", "C"], min_required=1)
        assert ok

    def test_min_required_blocks_incorrect_even_if_threshold_met(self):
        ok, _ = score_mcq_multi(["A", "X"], ["A", "B"], min_required=1)
        assert not ok


class TestPickedErrorTags:
    def test_picks_only_incorrect_tags(self):
        options = [
            {"value": "A", "error_tag": None},
            {"value": "B", "error_tag": None},
            {"value": "C", "error_tag": "tag_c"},
            {"value": "D", "error_tag": "tag_d"},
        ]
        tags = picked_error_tags(["A", "C"], options, ["A", "B"])
        assert tags == ["tag_c"]


class TestExtractErrorTag:
    def test_mcq_single_lookup(self):
        params = {
            "options_meta": [
                {"value": "A", "error_tag": None},
                {"value": "B", "error_tag": "tag_b"},
            ]
        }
        assert extract_error_tag("mcq", "B", "A", params) == "tag_b"
        assert extract_error_tag("mcq", "A", "A", params) is None

    def test_mcq_multi_first_tag(self):
        params = {
            "options_meta": [
                {"value": "A", "error_tag": None},
                {"value": "X", "error_tag": "tag_x"},
            ]
        }
        assert extract_error_tag("mcq_multi", ["A", "X"], ["A"], params) == "tag_x"

    def test_binary_equality_from_params(self):
        assert extract_error_tag("binary_equality", "=", "≠", {"error_tag": "commut"}) == "commut"

    def test_number_returns_none(self):
        assert extract_error_tag("number", "3", 4, {}) is None
