import json
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from apps.exercises import investigation
from apps.exercises.investigation import feedback_for, investigate

pytestmark = pytest.mark.real_investigation


def _fake_response(payload: dict):
    text = json.dumps(payload)
    return SimpleNamespace(content=[SimpleNamespace(type="text", text=text)])


def _attempt(is_correct=False):
    return SimpleNamespace(
        id="att-1",
        is_correct=is_correct,
        student_answer="11",
        correct_answer="13",
        exercise_params={"a": 7, "b": 6, "op": "+"},
        skill=SimpleNamespace(
            id="add_avec_retenue_20",
            label="Addition avec retenue ≤ 20",
            grade="P2",
            description="",
            prerequisites=SimpleNamespace(all=lambda: []),
        ),
        session=SimpleNamespace(student=SimpleNamespace(id="s")),
    )


@pytest.fixture
def fake_client(monkeypatch):
    client = MagicMock()
    monkeypatch.setattr(investigation, "_get_client", lambda: client)
    monkeypatch.setattr(investigation, "_mastery_summary", lambda attempt: "  (stub mastery)")
    return client


def test_correct_answer_skips_api(monkeypatch):
    called = {"n": 0}

    def boom(*a, **k):
        called["n"] += 1
        raise AssertionError("API should not be called for correct attempts")

    monkeypatch.setattr(investigation, "investigate", boom)
    out = feedback_for(_attempt(is_correct=True))
    assert out["is_correct"] is True
    assert called["n"] == 0


def test_haiku_high_confidence_no_escalation(fake_client, settings):
    settings.TUTOR_MODEL_PRIMARY = "haiku-x"
    settings.TUTOR_MODEL_ESCALATION = "sonnet-x"
    fake_client.messages.create.return_value = _fake_response(
        {
            "feedback_text": "Tu as oublié la retenue.",
            "next_action": "investigate",
            "next_skill_id": "add_sans_retenue_10",
            "confidence": 0.9,
        }
    )
    result = investigate(_attempt())
    assert result.model == "haiku-x"
    assert result.next_action == "investigate"
    assert result.next_skill_id == "add_sans_retenue_10"
    assert fake_client.messages.create.call_count == 1


def test_low_confidence_escalates_to_sonnet(fake_client, settings):
    settings.TUTOR_MODEL_PRIMARY = "haiku-x"
    settings.TUTOR_MODEL_ESCALATION = "sonnet-x"
    fake_client.messages.create.side_effect = [
        _fake_response(
            {
                "feedback_text": "hmm",
                "next_action": "practice",
                "next_skill_id": None,
                "confidence": 0.2,
            }
        ),
        _fake_response(
            {
                "feedback_text": "Confusion entre dizaines et unités.",
                "next_action": "redirect",
                "next_skill_id": "decomposition_dizaines",
                "confidence": 0.85,
            }
        ),
    ]
    result = investigate(_attempt())
    assert fake_client.messages.create.call_count == 2
    assert result.model == "sonnet-x"
    assert result.next_skill_id == "decomposition_dizaines"


def test_unparseable_response_escalates_then_falls_back(fake_client):
    bad = SimpleNamespace(content=[SimpleNamespace(type="text", text="not json at all")])
    fake_client.messages.create.return_value = bad
    result = investigate(_attempt())
    assert fake_client.messages.create.call_count == 2
    assert result.next_action == "practice"
    assert result.confidence == 0.0


def test_invalid_next_action_rejected(fake_client):
    fake_client.messages.create.return_value = _fake_response(
        {
            "feedback_text": "x",
            "next_action": "bogus",
            "next_skill_id": None,
            "confidence": 0.9,
        }
    )
    result = investigate(_attempt())
    assert result.next_action == "practice"


def test_strategies_are_extracted(fake_client):
    fake_client.messages.create.return_value = _fake_response(
        {
            "feedback_text": "Tu as oublié la retenue.",
            "next_action": "investigate",
            "next_skill_id": "add_faits_10",
            "confidence": 0.9,
            "strategies": [
                {"name": "Décomposition", "explanation": "Sépare 13 en 10 + 3."},
                {"name": "Dessin", "explanation": "Dessine des points et regroupe par 10."},
                {"name": "X", "explanation": ""},
            ],
        }
    )
    result = investigate(_attempt())
    assert len(result.strategies) == 2
    assert result.strategies[0]["name"] == "Décomposition"


def test_feedback_for_handles_api_failure(monkeypatch):
    def raise_(_):
        raise RuntimeError("api down")

    monkeypatch.setattr(investigation, "investigate", raise_)
    out = feedback_for(_attempt(is_correct=False))
    assert out["is_correct"] is False
    assert out["next_action"] == "practice"
    assert "message" in out
