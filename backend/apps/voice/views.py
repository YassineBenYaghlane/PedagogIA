import logging

from django.http import StreamingHttpResponse
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.students.models import Student

from .elevenlabs import ElevenLabsError, stream_tts, transcribe
from .quota import QuotaExceeded, get_usage, reserve

logger = logging.getLogger(__name__)

MAX_TTS_CHARS = 1500
MAX_STT_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_VOICES = {"female", "male"}


def _student_owned(user, student_id) -> Student:
    student = get_object_or_404(Student, id=student_id)
    if student.user_id != user.id:
        raise PermissionDenied("not your student")
    return student


def _usage_payload(snapshot) -> dict:
    return {
        "used": snapshot.used,
        "cap": snapshot.cap,
        "percent": snapshot.percent,
        "remaining": snapshot.remaining,
    }


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def tts(request):
    """Stream MP3 audio for the given text using the requested voice.

    Requires `student_id` so the request is charged against the student's
    monthly char quota.
    """
    text = (request.data.get("text") or "").strip()
    voice = (request.data.get("voice") or "female").strip().lower()
    student_id = request.data.get("student_id")
    if not text:
        return Response({"detail": "text required"}, status=400)
    if len(text) > MAX_TTS_CHARS:
        return Response({"detail": f"text too long (>{MAX_TTS_CHARS})"}, status=400)
    if voice not in ALLOWED_VOICES:
        return Response({"detail": "voice must be 'female' or 'male'"}, status=400)
    if not student_id:
        return Response({"detail": "student_id required"}, status=400)
    student = _student_owned(request.user, student_id)
    try:
        snapshot = reserve(student, len(text))
    except QuotaExceeded as exc:
        return Response(
            {"detail": "tts quota exceeded for this month", "used": exc.used, "cap": exc.cap},
            status=429,
        )
    try:
        chunks = stream_tts(text, voice)
    except ElevenLabsError as exc:
        logger.warning("tts request rejected: %s", exc)
        return Response({"detail": "tts unavailable"}, status=502)
    response = StreamingHttpResponse(chunks, content_type="audio/mpeg")
    response["Cache-Control"] = "no-store"
    response["X-Voice-Chars-Used"] = str(snapshot.used)
    response["X-Voice-Chars-Cap"] = str(snapshot.cap)
    return response


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def usage(request, student_id):
    """Return the current month's voice quota usage for the given student."""
    student = _student_owned(request.user, student_id)
    snapshot = get_usage(student)
    return Response(_usage_payload(snapshot))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def stt(request):
    """Transcribe an uploaded audio file. Returns {text}."""
    upload = request.FILES.get("audio")
    if upload is None:
        return Response({"detail": "audio file required"}, status=400)
    if upload.size > MAX_STT_BYTES:
        return Response({"detail": "audio too large"}, status=400)
    try:
        text = transcribe(
            upload.read(),
            filename=upload.name or "clip.webm",
            content_type=upload.content_type or "audio/webm",
        )
    except ElevenLabsError as exc:
        logger.warning("stt request rejected: %s", exc)
        return Response({"detail": "stt unavailable"}, status=502)
    return Response({"text": text})
