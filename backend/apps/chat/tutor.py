import logging
from collections.abc import Iterable

from django.conf import settings

from apps.exercises.models import Attempt
from apps.sessions.exports import daily_activity_summary
from apps.skills.models import Skill
from apps.students.models import SKILL_XP_MAX, Student, StudentSkillState
from apps.students.serializers import mastery_counts
from apps.students.services.streaks import daily_progress

from .models import KIND_EXERCICE, Conversation, Message

logger = logging.getLogger(__name__)

MAX_HISTORY = 40
STREAM_MAX_TOKENS = 600

APP_CONTEXT = (
    "L'application :\n"
    "- Tu vis dans CollegIA, une application web d'apprentissage adaptatif des "
    "mathématiques pour les élèves de l'enseignement primaire belge (FWB), de la P1 "
    "à la P6. Le programme suit le Référentiel de Mathématiques de la FWB (champ "
    "Arithmétique pour le moment).\n"
    "- L'élève progresse à travers un arbre de compétences (skill tree) : chaque "
    "compétence a ses prérequis, et l'application choisit les exercices en fonction "
    "de ce qu'il maîtrise déjà. La progression est visualisée comme un jardin — "
    "chaque compétence est une plante qui fleurit quand elle est acquise.\n"
    "- L'élève peut pratiquer dans plusieurs modes : « Entraînement » (sélection "
    "automatique adaptative), « Automatismes » (drill ciblé sur une compétence), "
    "« Test de Niveau » (diagnostic) et « Examen ». Il gagne de l'XP, monte en "
    "rang, et garde une série quotidienne (streak).\n"
    "- Toi, tu es le tuteur intégré. Deux portes d'entrée : depuis l'accueil "
    "(« Pose ta question », chat libre) ou depuis un exercice raté (bouton "
    "« Demander de l'aide » dans l'établi).\n"
    "- Si l'élève te demande où il est, comment marche l'app, à quoi servent les "
    "boutons, ou ce que veut dire un mot du jardin (floraison, herbier, carte), "
    "réponds simplement avec ce contexte. Tu n'inventes jamais d'autre nom pour "
    "l'application — c'est CollegIA."
)


SYSTEM_PROMPT = (
    "Tu es un tuteur scolaire bienveillant pour des élèves belges (FWB) de 6 à 12 ans. "
    "Tu aides en priorité en mathématiques et plus largement sur les matières scolaires "
    "(français, sciences, devoirs).\n\n"
    "Connaissance de l'élève :\n"
    "- Le prénom et le niveau scolaire de l'élève sont fournis dans le bloc « Élève » "
    "ci-dessous. Tu peux les utiliser librement (par exemple t'adresser à lui par son "
    "prénom). Si l'élève te demande son prénom ou son niveau, tu réponds simplement.\n"
    "- En revanche, tu ne demandes jamais d'autres informations personnelles à l'élève "
    "(nom de famille, adresse, téléphone, école, mot de passe).\n\n"
    "Règles strictes :\n"
    "- Tu réponds en français, dans un vocabulaire adapté à l'âge de l'élève.\n"
    "- Tu adoptes une approche Socratique : tu poses des questions, tu décomposes, "
    "tu donnes des indices — tu ne donnes jamais la réponse complète d'un seul coup.\n"
    "- Si l'élève sort du scolaire (jeux, vie privée, sujets sensibles, contenu adulte), "
    "tu recadres poliment : « Je suis ton tuteur scolaire, je t'aide pour tes "
    "apprentissages. Si tu as une question sur tes leçons, vas-y ! »\n"
    "- Tu refuses tout contenu inapproprié (violence, sexualité, drogues, etc.) et tu "
    "invites à en parler à un adulte de confiance si besoin.\n"
    "- Tes messages sont courts (2 à 4 phrases en général) pour ne pas écraser l'élève.\n\n"
    "Format de réponse :\n"
    "- Texte brut uniquement. Pas de markdown : pas d'astérisques pour mettre en gras "
    "(`**texte**`) ni en italique (`*texte*`), pas de `#` pour les titres, pas de blocs "
    "de code à backticks. Si tu veux insister sur un mot, tu peux le mettre EN MAJUSCULES "
    "ou entre « guillemets ».\n"
    "- Pas d'emojis ni de pictogrammes (😊, ✨, 👉, etc.). L'interface est sobre, "
    "l'émoji détonne.\n"
    "- Pour des listes courtes, utilise des tirets `-` en début de ligne. C'est tout."
)

MODE_BLOCK_FREE = (
    "Mode : chat libre.\n"
    "L'élève te pose une question hors d'un exercice. Garde le ton Socratique : "
    "questionne, illustre, donne des indices."
)

MODE_BLOCK_EXERCICE_AFTER = (
    "Mode : aide à l'exercice (après une mauvaise réponse).\n"
    "L'élève vient de se tromper sur l'exercice ci-dessous. Aide-le Socratiquement à "
    "comprendre son erreur — sans jamais lui donner la réponse complète d'emblée. "
    "Quand tu sens qu'il a compris, propose-lui en une phrase courte de cliquer sur le "
    "bouton « Réessayer » pour reprendre la même compétence, ou sur « Suivant » pour "
    "passer à l'exercice suivant — sans détailler, juste un rappel."
)

MODE_BLOCK_EXERCICE_BEFORE = (
    "Mode : aide à l'exercice (avant la réponse).\n"
    "L'élève est devant l'exercice ci-dessous et te demande de l'aide AVANT de "
    "répondre. Tu ne donnes JAMAIS la réponse — tu poses une première question "
    "Socratique pour comprendre ce qu'il a déjà saisi de l'énoncé, puis tu le guides "
    "étape par étape. Quand tu sens qu'il est prêt à essayer, dis-lui qu'il peut "
    "fermer le chat et entrer sa réponse — sans plus de cérémonie."
)

DEFAULT_OPENER = (
    "Pas de souci, on va regarder ça ensemble. "
    "Avant de chercher la bonne réponse, peux-tu m'expliquer comment tu as fait ?"
)

DEFAULT_OPENER_BEFORE = (
    "Bonne idée d'en parler. Avant que je te donne des pistes, dis-moi : qu'as-tu "
    "compris de l'énoncé ?"
)


def _get_client():
    from anthropic import Anthropic

    api_key = settings.ANTHROPIC_API_KEY
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is not set")
    return Anthropic(api_key=api_key)


def _student_block(student: Student) -> str:
    return f"Élève : {student.display_name}, niveau {student.grade} (FWB)."


def _profile_block(student: Student) -> str:
    """Always-on snapshot of the student's progress, mastery, and recent activity.

    Three sub-blocks: profile (xp/rank/streak/daily goal), mastery counts +
    top 3 skills in progress, last-7-days activity. Refreshed on each request —
    not cacheable across days but warm during a chat session.
    """
    daily_done = daily_progress(student)
    profile_lines = [
        "Profil :",
        f"  - Rang : {student.rank} ({student.xp} XP)",
        f"  - Série actuelle : {student.current_streak} jour(s) (record {student.best_streak})",
        f"  - Objectif du jour : {daily_done} / {student.daily_goal}",
    ]

    counts = mastery_counts(student)
    in_progress_total = (
        counts.get("learning_easy", 0)
        + counts.get("learning_medium", 0)
        + counts.get("learning_hard", 0)
    )
    mastery_lines = [
        "Maîtrise du référentiel :",
        f"  - Acquis : {counts.get('mastered', 0)}",
        f"  - En cours : {in_progress_total}",
        f"  - À revoir : {counts.get('needs_review', 0)}",
        f"  - Pas encore commencé : {counts.get('not_started', 0)}",
    ]

    top_in_progress = (
        StudentSkillState.objects.filter(student=student, skill_xp__gt=0, skill_xp__lt=SKILL_XP_MAX)
        .select_related("skill")
        .order_by("-skill_xp", "-updated_at")[:3]
    )
    if top_in_progress:
        mastery_lines.append("Compétences en cours (top 3) :")
        for s in top_in_progress:
            pct = int(round(s.mastery_level * 100))
            mastery_lines.append(f"  - {s.skill.label} ({s.skill.grade}) — {pct}%")

    week = daily_activity_summary(student, days=7)
    accuracy_pct = int(round((week.get("accuracy") or 0) * 100))
    activity_lines = [
        "7 derniers jours :",
        f"  - Exercices tentés : {week.get('attempts', 0)} ({accuracy_pct}% de réussite)",
        f"  - Sessions : {week.get('sessions', 0)}",
    ]

    return "\n".join(profile_lines + [""] + mastery_lines + [""] + activity_lines)


def _skill_context_block(skill: Skill | None, student: Student | None) -> str | None:
    if skill is None:
        return None
    lines = [f"Compétence : {skill.id} — {skill.label} (niveau {skill.grade})"]
    if skill.description:
        lines.append(f"Description : {skill.description}")
    prereqs = list(skill.prerequisites.all())
    if prereqs:
        lines.append("Prérequis :")
        for p in prereqs:
            lines.append(f"  - {p.id} : {p.label}")
    if student is not None:
        lines.append("\nÉtat de maîtrise de l'élève :")
        skill_ids = [skill.id] + [p.id for p in prereqs]
        states = {
            s.skill_id: s
            for s in StudentSkillState.objects.filter(student=student, skill_id__in=skill_ids)
        }
        for sid in skill_ids:
            s = states.get(sid)
            if s is None:
                lines.append(f"  - {sid} : jamais pratiqué")
            else:
                lines.append(
                    f"  - {sid} : maîtrise={s.mastery_level:.2f}, "
                    f"xp={s.skill_xp:.1f}, tentatives={s.total_attempts}"
                )
    return "\n".join(lines)


def _attempt_context_block(conv: Conversation) -> str | None:
    """Build the exercice context block from either the linked Attempt or the anchor payload."""
    attempt = conv.anchor_attempt
    if attempt is not None:
        return (
            "Contexte exercice :\n"
            f"  - Énoncé/paramètres : {attempt.exercise_params}\n"
            f"  - Réponse de l'élève : {attempt.student_answer}\n"
            f"  - Réponse correcte : {attempt.correct_answer}"
        )
    if conv.anchor_exercise_params or conv.anchor_exercise_prompt:
        lines = ["Contexte exercice :"]
        if conv.anchor_exercise_prompt:
            lines.append(f"  - Énoncé : {conv.anchor_exercise_prompt}")
        if conv.anchor_exercise_params:
            lines.append(f"  - Paramètres : {conv.anchor_exercise_params}")
        lines.append("  - L'élève n'a pas encore répondu.")
        return "\n".join(lines)
    return None


def _system_blocks(conv: Conversation) -> list[dict]:
    """Build the system message with prompt-cached student/skill/attempt blocks."""
    student = conv.student
    blocks: list[dict] = [{"type": "text", "text": SYSTEM_PROMPT}]
    blocks.append({"type": "text", "text": APP_CONTEXT, "cache_control": {"type": "ephemeral"}})
    blocks.append({"type": "text", "text": _student_block(student)})
    blocks.append({"type": "text", "text": _profile_block(student)})

    if conv.kind == KIND_EXERCICE:
        mode_block = (
            MODE_BLOCK_EXERCICE_AFTER
            if conv.anchor_attempt_id is not None
            else MODE_BLOCK_EXERCICE_BEFORE
        )
        blocks.append({"type": "text", "text": mode_block})
        skill_block = _skill_context_block(conv.anchor_skill, student)
        if skill_block:
            blocks.append(
                {
                    "type": "text",
                    "text": skill_block,
                    "cache_control": {"type": "ephemeral"},
                }
            )
        attempt_block = _attempt_context_block(conv)
        if attempt_block:
            blocks.append({"type": "text", "text": attempt_block})
    else:
        blocks.append({"type": "text", "text": MODE_BLOCK_FREE})
    return blocks


def _history_messages(conversation: Conversation) -> list[dict]:
    qs = conversation.messages.order_by("created_at")
    msgs = list(qs.values("role", "content"))[-MAX_HISTORY:]
    out = []
    for m in msgs:
        if m["role"] == "system":
            continue
        role = "user" if m["role"] == "student" else "assistant"
        out.append({"role": role, "content": m["content"]})
    return out


def stream_reply(conversation: Conversation) -> Iterable[str]:
    """Yield text chunks from the tutor for the latest student message in `conversation`.

    The caller is responsible for having already persisted the student's message.
    """
    client = _get_client()
    system = _system_blocks(conversation)
    history = _history_messages(conversation)
    if not history:
        return

    model = settings.TUTOR_MODEL_PRIMARY
    with client.messages.stream(
        model=model,
        max_tokens=STREAM_MAX_TOKENS,
        system=system,
        messages=history,
    ) as stream:
        for text in stream.text_stream:
            yield text


def open_for_exercise_message(
    student: Student,
    *,
    skill: Skill | None,
    prompt: str,
    params: dict,
) -> Message:
    """Open a fresh exercice-mode conversation for an exercise the student hasn't answered yet."""
    title = skill.label if skill else "Aide à l'exercice"
    conv = Conversation.objects.create(
        student=student,
        kind=KIND_EXERCICE,
        title=title[:120],
        anchor_skill=skill,
        anchor_exercise_prompt=(prompt or "")[:500],
        anchor_exercise_params=params or {},
    )
    return conv.messages.create(
        role="assistant",
        content=DEFAULT_OPENER_BEFORE,
        context_skill=skill,
        model="seed",
    )


def _resolve_skill(attempt: Attempt) -> Skill | None:
    direct = getattr(attempt, "skill", None)
    if direct is not None:
        return direct
    session = getattr(attempt, "session", None)
    target = getattr(session, "target_skill", None) if session is not None else None
    if target is not None:
        return target
    template = getattr(attempt, "template", None)
    if template is None:
        return None
    try:
        return template.skills.first()
    except AttributeError:
        return None


def open_in_exercice_message(attempt: Attempt) -> tuple[Message, str | None]:
    """Open a fresh exercice-mode conversation seeded with a Socratic opener.

    Each wrong attempt starts its own conversation thread anchored on the attempt
    and skill, so the LLM gets full exercice context. Returns (seed_message,
    next_skill_id).
    """
    student = attempt.session.student
    skill = _resolve_skill(attempt)

    opener_text = DEFAULT_OPENER
    next_skill_id: str | None = None
    model_used = "seed"
    try:
        from apps.exercises.investigation import investigate

        result = investigate(attempt)
        if result.feedback_text:
            opener_text = result.feedback_text
            model_used = result.model
        next_skill_id = result.next_skill_id
    except Exception:
        logger.exception("investigation seed failed for attempt %s", attempt.id)

    title = skill.label if skill else "Aide à l'exercice"
    conv = Conversation.objects.create(
        student=student,
        kind=KIND_EXERCICE,
        title=title[:120],
        anchor_skill=skill,
        anchor_attempt=attempt,
    )
    seed = conv.messages.create(
        role="assistant",
        content=opener_text,
        context_attempt=attempt,
        context_skill=skill,
        model=model_used,
    )
    return seed, next_skill_id
