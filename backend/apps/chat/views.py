import json
import logging

from django.db.models import Count
from django.http import StreamingHttpResponse
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from django.core import signing

from apps.exercises.models import Attempt, ExerciseTemplate
from apps.exercises.services import ANSWER_SALT
from apps.students.models import Student

from .models import Conversation
from .serializers import (
    ConversationListSerializer,
    ConversationSerializer,
    MessageSerializer,
)
from .tutor import open_for_exercise_message, open_in_exercice_message, stream_reply

logger = logging.getLogger(__name__)

DEFAULT_TITLE_FALLBACK = "Nouvelle conversation"
TITLE_MAX = 120


def _student_owned(user, student_id) -> Student:
    student = get_object_or_404(Student, id=student_id)
    if student.user_id != user.id:
        raise PermissionDenied("not your student")
    return student


def _conversation_owned(user, conversation_id) -> Conversation:
    conv = get_object_or_404(
        Conversation.objects.select_related("student"), id=conversation_id
    )
    if conv.student.user_id != user.id:
        raise PermissionDenied("not your conversation")
    return conv


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def conversations_for_student(request, student_id):
    """List or create conversations for a student."""
    student = _student_owned(request.user, student_id)
    if request.method == "GET":
        qs = (
            Conversation.objects.filter(student=student)
            .annotate(message_count=Count("messages"))
            .order_by("-updated_at")
        )
        return Response(ConversationListSerializer(qs, many=True).data)
    title = (request.data.get("title") or DEFAULT_TITLE_FALLBACK).strip()[:TITLE_MAX]
    conv = Conversation.objects.create(student=student, title=title)
    return Response(ConversationSerializer(conv).data, status=201)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def conversation_detail(request, conversation_id):
    """Read full conversation, rename via PATCH, or delete via DELETE."""
    conv = _conversation_owned(request.user, conversation_id)
    if request.method == "DELETE":
        conv.delete()
        return Response(status=204)
    if request.method == "PATCH":
        title = request.data.get("title")
        if not isinstance(title, str) or not title.strip():
            raise ValidationError({"title": "non-empty string required"})
        conv.title = title.strip()[:TITLE_MAX]
        conv.save(update_fields=["title", "updated_at"])
    return Response(ConversationSerializer(conv).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def messages(request, conversation_id):
    conv = _conversation_owned(request.user, conversation_id)
    qs = conv.messages.all()
    return Response(MessageSerializer(qs, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def open_for_exercise(request):
    """Open a fresh chat anchored on the *current* exercise the student is looking at.

    Used when the student clicks "Réfléchir avec le tuteur" before submitting any
    answer. Decodes the exercise signature so the LLM gets prompt + params + skill.
    """
    student_id = request.data.get("student_id")
    signature = request.data.get("signature")
    prompt = request.data.get("prompt") or ""
    if not student_id or not signature:
        raise ValidationError({"detail": "student_id and signature are required"})
    student = _student_owned(request.user, student_id)
    try:
        payload = signing.loads(signature, salt=ANSWER_SALT, max_age=60 * 60 * 6)
    except signing.BadSignature as exc:
        raise ValidationError({"signature": "invalid or expired"}) from exc
    template = ExerciseTemplate.objects.prefetch_related("skills").filter(
        id=payload.get("template_id")
    ).first()
    skill = template.skills.first() if template else None
    seed = open_for_exercise_message(
        student,
        skill=skill,
        prompt=str(prompt),
        params=payload.get("params") or {},
    )
    return Response(
        {
            "conversation_id": str(seed.conversation_id),
            "seed_message_id": str(seed.id),
        },
        status=201,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def open_for_attempt(request, attempt_id):
    """Open a fresh conversation seeded with a Socratic opener for a wrong attempt."""
    attempt = get_object_or_404(
        Attempt.objects.select_related("session__student", "template"),
        id=attempt_id,
        session__student__user=request.user,
    )
    if attempt.is_correct:
        raise ValidationError({"detail": "chat only opens for wrong attempts"})
    seed, next_skill_id = open_in_exercice_message(attempt)
    return Response(
        {
            "conversation_id": str(seed.conversation_id),
            "seed_message_id": str(seed.id),
            "next_skill_id": next_skill_id,
        },
        status=201,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_message(request, conversation_id):
    """Append a student message, then stream the tutor's reply as NDJSON."""
    conv = _conversation_owned(request.user, conversation_id)
    content = (request.data.get("content") or "").strip()
    if not content:
        raise ValidationError({"content": "required"})

    student_msg = conv.messages.create(role="student", content=content)
    _maybe_set_title_from(conv, content)
    return StreamingHttpResponse(
        _stream_assistant(conv, student_msg),
        content_type="application/x-ndjson",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


def _maybe_set_title_from(conv: Conversation, content: str) -> None:
    """Auto-derive a title from the first student message when none is set."""
    if conv.title and conv.title != DEFAULT_TITLE_FALLBACK:
        return
    title = content.strip().splitlines()[0][:TITLE_MAX] if content.strip() else ""
    if title:
        conv.title = title
        conv.save(update_fields=["title", "updated_at"])


def _stream_assistant(conv: Conversation, student_msg) -> "iter[bytes]":
    from django.conf import settings as dj_settings

    chunks: list[str] = []
    model_used = dj_settings.TUTOR_MODEL_PRIMARY
    try:
        for piece in stream_reply(conv):
            chunks.append(piece)
            yield (json.dumps({"type": "chunk", "text": piece}) + "\n").encode("utf-8")
    except Exception as exc:
        logger.exception("tutor stream failed for conv %s", conv.id)
        yield (
            json.dumps({"type": "error", "detail": str(exc)}) + "\n"
        ).encode("utf-8")
        return

    full = "".join(chunks).strip()
    if not full:
        full = "Désolé, je n'ai pas trouvé de réponse. Tu peux reformuler ?"
    assistant_msg = conv.messages.create(
        role="assistant",
        content=full,
        model=model_used,
    )
    yield (
        json.dumps(
            {
                "type": "done",
                "message_id": str(assistant_msg.id),
                "model": model_used,
            }
        )
        + "\n"
    ).encode("utf-8")
