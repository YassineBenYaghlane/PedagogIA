"""Thin ElevenLabs HTTP client used by `apps.voice` views."""

from __future__ import annotations

import logging
from typing import Iterator

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

API_BASE = "https://api.elevenlabs.io/v1"
TTS_TIMEOUT = 30
STT_TIMEOUT = 60


class ElevenLabsError(Exception):
    """Surfaced when the ElevenLabs API errors out."""


def _voice_id_for(gender: str) -> str:
    """Resolve `female` / `male` to the configured ElevenLabs voice id."""
    if gender == "male":
        vid = settings.ELEVENLABS_MALE_VOICE_ID
    else:
        vid = settings.ELEVENLABS_FEMALE_VOICE_ID
    if not vid:
        raise ElevenLabsError(f"voice id for '{gender}' not configured")
    return vid


def stream_tts(text: str, gender: str) -> Iterator[bytes]:
    """Yield MP3 chunks of `text` spoken with the gendered voice."""
    api_key = settings.ELEVENLABS_API_KEY
    if not api_key:
        raise ElevenLabsError("ELEVENLABS_API_KEY not set")
    voice_id = _voice_id_for(gender)
    url = f"{API_BASE}/text-to-speech/{voice_id}/stream"
    payload = {
        "text": text,
        "model_id": settings.ELEVENLABS_TTS_MODEL,
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
    }
    headers = {
        "xi-api-key": api_key,
        "accept": "audio/mpeg",
        "content-type": "application/json",
    }
    resp = requests.post(url, json=payload, headers=headers, stream=True, timeout=TTS_TIMEOUT)
    if resp.status_code >= 400:
        body = resp.text[:500]
        logger.warning("elevenlabs tts failed: %s %s", resp.status_code, body)
        raise ElevenLabsError(f"tts failed ({resp.status_code})")
    for chunk in resp.iter_content(chunk_size=4096):
        if chunk:
            yield chunk


def transcribe(audio: bytes, filename: str, content_type: str) -> str:
    """Send audio bytes to Scribe and return the transcribed text."""
    api_key = settings.ELEVENLABS_API_KEY
    if not api_key:
        raise ElevenLabsError("ELEVENLABS_API_KEY not set")
    url = f"{API_BASE}/speech-to-text"
    files = {"file": (filename, audio, content_type)}
    data = {
        "model_id": settings.ELEVENLABS_STT_MODEL,
        "language_code": "fra",
    }
    headers = {"xi-api-key": api_key}
    resp = requests.post(url, headers=headers, data=data, files=files, timeout=STT_TIMEOUT)
    if resp.status_code >= 400:
        logger.warning("elevenlabs stt failed: %s %s", resp.status_code, resp.text[:500])
        raise ElevenLabsError(f"stt failed ({resp.status_code})")
    return (resp.json().get("text") or "").strip()
