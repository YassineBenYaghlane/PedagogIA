import json
import logging
from dataclasses import dataclass
from typing import Literal

from django.conf import settings

from apps.skills.models import Skill
from apps.students.models import StudentSkillState

from .models import Attempt

logger = logging.getLogger(__name__)

NextAction = Literal["practice", "investigate", "redirect"]
ALLOWED_ACTIONS = ("practice", "investigate", "redirect")
CONFIDENCE_THRESHOLD = 0.6
MAX_TOKENS = 600

SYSTEM_PROMPT = (
    "Tu es un tuteur de mathématiques pour des élèves belges (FWB) de 6 à 12 ans. "
    "Quand un élève se trompe, tu identifies la cause profonde de l'erreur en "
    "t'appuyant sur l'arbre des compétences fourni. Ta réponse est un objet JSON "
    "strict avec les clés: feedback_text (français, court, bienveillant, sans "
    "donner la réponse), next_action (practice|investigate|redirect), "
    "next_skill_id (id d'une compétence prérequise à tester, ou null), "
    "confidence (0..1)."
)


@dataclass
class InvestigationResult:
    feedback_text: str
    next_action: NextAction
    next_skill_id: str | None
    confidence: float
    model: str

    def to_dict(self) -> dict:
        return {
            "feedback_text": self.feedback_text,
            "next_action": self.next_action,
            "next_skill_id": self.next_skill_id,
            "confidence": self.confidence,
            "model": self.model,
        }


def _get_client():
    from anthropic import Anthropic

    api_key = settings.ANTHROPIC_API_KEY
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is not set")
    return Anthropic(api_key=api_key)


def _build_skill_context(skill: Skill) -> str:
    prereqs = list(skill.prerequisites.all())
    lines = [f"Compétence ciblée: {skill.id} — {skill.label} (niveau {skill.grade})"]
    if skill.description:
        lines.append(f"Description: {skill.description}")
    if prereqs:
        lines.append("Prérequis:")
        for p in prereqs:
            lines.append(f"  - {p.id}: {p.label}")
    else:
        lines.append("Prérequis: (aucun)")
    return "\n".join(lines)


def _build_user_prompt(attempt: Attempt, mastery_summary: str) -> str:
    return (
        f"Question posée: {attempt.exercise_params}\n"
        f"Réponse de l'élève: {attempt.student_answer}\n"
        f"Réponse correcte: {attempt.correct_answer}\n\n"
        f"État de maîtrise (élève):\n{mastery_summary}\n\n"
        "Analyse l'erreur et renvoie le JSON demandé."
    )


def _mastery_summary(attempt: Attempt) -> str:
    skill = attempt.skill
    student = attempt.session.student
    skill_ids = [skill.id] + [p.id for p in skill.prerequisites.all()]
    states = {
        s.skill_id: s
        for s in StudentSkillState.objects.filter(student=student, skill_id__in=skill_ids)
    }
    lines = []
    for sid in skill_ids:
        s = states.get(sid)
        if s is None:
            lines.append(f"  - {sid}: jamais pratiqué")
        else:
            lines.append(
                f"  - {sid}: maîtrise={s.mastery_level:.2f}, "
                f"corrects consécutifs={s.consecutive_correct}, "
                f"tentatives={s.total_attempts}"
            )
    return "\n".join(lines) if lines else "  (vide)"


def _parse_response(text: str) -> dict | None:
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end == -1:
            return None
        try:
            data = json.loads(text[start : end + 1])
        except json.JSONDecodeError:
            return None
    if not isinstance(data, dict):
        return None
    if data.get("next_action") not in ALLOWED_ACTIONS:
        return None
    if not isinstance(data.get("feedback_text"), str):
        return None
    return data


def _call_model(client, model: str, skill_context: str, user_prompt: str) -> dict | None:
    message = client.messages.create(
        model=model,
        max_tokens=MAX_TOKENS,
        system=[
            {"type": "text", "text": SYSTEM_PROMPT},
            {
                "type": "text",
                "text": skill_context,
                "cache_control": {"type": "ephemeral"},
            },
        ],
        messages=[{"role": "user", "content": user_prompt}],
    )
    text = "".join(
        block.text for block in message.content if getattr(block, "type", None) == "text"
    )
    return _parse_response(text)


def investigate(attempt: Attempt) -> InvestigationResult:
    """Run AI root-cause investigation for a wrong attempt. Haiku → Sonnet escalation."""
    client = _get_client()
    skill_context = _build_skill_context(attempt.skill)
    user_prompt = _build_user_prompt(attempt, _mastery_summary(attempt))

    primary = settings.INVESTIGATION_MODEL_PRIMARY
    escalation = settings.INVESTIGATION_MODEL_ESCALATION

    parsed = _call_model(client, primary, skill_context, user_prompt)
    used_model = primary
    if parsed is None or float(parsed.get("confidence", 0)) < CONFIDENCE_THRESHOLD:
        escalated = _call_model(client, escalation, skill_context, user_prompt)
        if escalated is not None:
            parsed = escalated
            used_model = escalation

    if parsed is None:
        return InvestigationResult(
            feedback_text="Pas tout à fait. On va reprendre cette étape ensemble.",
            next_action="practice",
            next_skill_id=None,
            confidence=0.0,
            model=used_model,
        )

    next_skill_id = parsed.get("next_skill_id")
    if isinstance(next_skill_id, str) and next_skill_id.strip() == "":
        next_skill_id = None
    return InvestigationResult(
        feedback_text=parsed["feedback_text"],
        next_action=parsed["next_action"],
        next_skill_id=next_skill_id,
        confidence=float(parsed.get("confidence", 0.0)),
        model=used_model,
    )


def feedback_for(attempt: Attempt) -> dict:
    """Return feedback dict for an attempt. Rule-based for correct, AI for wrong."""
    if attempt.is_correct:
        return {
            "is_correct": True,
            "message": "Bravo, c'est juste !",
            "next_action": "practice",
            "next_skill_id": None,
        }
    try:
        result = investigate(attempt)
    except Exception:
        logger.exception("Investigation failed for attempt %s", attempt.id)
        return {
            "is_correct": False,
            "message": "Pas tout à fait. Essayons un autre exercice pour t'aider.",
            "next_action": "practice",
            "next_skill_id": None,
        }
    return {
        "is_correct": False,
        "message": result.feedback_text,
        "next_action": result.next_action,
        "next_skill_id": result.next_skill_id,
    }
