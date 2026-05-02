import io

import pytest
from django.test.utils import override_settings

from apps.students.models import Student
from apps.voice import elevenlabs as el
from apps.voice import views as voice_views
from apps.voice.models import VoiceUsage


def _make_student(user, display="Léa", grade="P2"):
    return Student.objects.create(user=user, display_name=display, grade=grade)


@pytest.mark.django_db
def test_tts_requires_auth(api):
    res = api.post("/api/voice/tts/", data={"text": "Bonjour"}, format="json")
    assert res.status_code in (401, 403)


@pytest.mark.django_db
def test_tts_validates_inputs(auth_client, user):
    s = _make_student(user)
    # missing text
    res = auth_client.post(
        "/api/voice/tts/", data={"text": "", "student_id": str(s.id)}, format="json"
    )
    assert res.status_code == 400
    # bad voice
    res = auth_client.post(
        "/api/voice/tts/",
        data={"text": "Bonjour", "voice": "robot", "student_id": str(s.id)},
        format="json",
    )
    assert res.status_code == 400
    # missing student_id
    res = auth_client.post("/api/voice/tts/", data={"text": "Bonjour"}, format="json")
    assert res.status_code == 400


@pytest.mark.django_db
def test_tts_rejects_other_users_student(auth_client, other_user):
    foreign = _make_student(other_user, display="Tom")
    res = auth_client.post(
        "/api/voice/tts/",
        data={"text": "Bonjour", "student_id": str(foreign.id)},
        format="json",
    )
    assert res.status_code == 403


@pytest.mark.django_db
def test_tts_streams_audio_and_increments_usage(monkeypatch, auth_client, user):
    s = _make_student(user)
    captured = {}

    def fake_stream(text, gender):
        captured["text"] = text
        captured["gender"] = gender
        yield b"\x00\x01"
        yield b"\x02\x03"

    monkeypatch.setattr(voice_views, "stream_tts", fake_stream)
    res = auth_client.post(
        "/api/voice/tts/",
        data={"text": "Salut", "voice": "male", "student_id": str(s.id)},
        format="json",
    )
    assert res.status_code == 200
    assert res["Content-Type"].startswith("audio/mpeg")
    assert b"".join(res.streaming_content) == b"\x00\x01\x02\x03"
    assert captured == {"text": "Salut", "gender": "male"}
    # Headers reflect the new usage
    assert res["X-Voice-Chars-Used"] == "5"  # len("Salut")
    assert res["X-Voice-Chars-Cap"] == "2800"
    # And the row is persisted
    row = VoiceUsage.objects.get(student=s)
    assert row.chars_used == 5


@pytest.mark.django_db
def test_tts_defaults_to_female(monkeypatch, auth_client, user):
    s = _make_student(user)
    captured = {}

    def fake_stream(text, gender):
        captured["gender"] = gender
        yield b""

    monkeypatch.setattr(voice_views, "stream_tts", fake_stream)
    res = auth_client.post(
        "/api/voice/tts/",
        data={"text": "Salut", "student_id": str(s.id)},
        format="json",
    )
    b"".join(res.streaming_content)
    assert captured["gender"] == "female"


@pytest.mark.django_db
@override_settings(TTS_MONTHLY_CHAR_CAP_PER_STUDENT=10)
def test_tts_returns_429_when_over_cap(monkeypatch, auth_client, user):
    s = _make_student(user)
    monkeypatch.setattr(voice_views, "stream_tts", lambda *_a, **_kw: iter([]))
    # First call uses 8 chars — under cap.
    res = auth_client.post(
        "/api/voice/tts/",
        data={"text": "Bonjour!", "student_id": str(s.id)},  # 8 chars
        format="json",
    )
    assert res.status_code == 200
    b"".join(res.streaming_content)
    # Second call would push us to 8+5=13 > 10 cap → 429.
    res = auth_client.post(
        "/api/voice/tts/",
        data={"text": "Salut", "student_id": str(s.id)},
        format="json",
    )
    assert res.status_code == 429
    body = res.json()
    assert body["used"] == 8
    assert body["cap"] == 10
    # Counter unchanged on rejection.
    assert VoiceUsage.objects.get(student=s).chars_used == 8


@pytest.mark.django_db
def test_usage_endpoint_returns_snapshot(auth_client, user):
    s = _make_student(user)
    res = auth_client.get(f"/api/voice/usage/{s.id}/")
    assert res.status_code == 200
    body = res.json()
    assert body == {"used": 0, "cap": 2800, "percent": 0, "remaining": 2800}


@pytest.mark.django_db
def test_usage_endpoint_scopes_to_owner(auth_client, other_user):
    foreign = _make_student(other_user, display="Tom")
    res = auth_client.get(f"/api/voice/usage/{foreign.id}/")
    assert res.status_code == 403


@pytest.mark.django_db
def test_stt_requires_audio(auth_client):
    res = auth_client.post("/api/voice/stt/", data={}, format="multipart")
    assert res.status_code == 400


@pytest.mark.django_db
def test_stt_returns_transcript(monkeypatch, auth_client):
    captured = {}

    def fake_transcribe(audio, filename, content_type):
        captured["bytes"] = audio
        captured["filename"] = filename
        captured["content_type"] = content_type
        return "combien font deux et trois"

    monkeypatch.setattr(voice_views, "transcribe", fake_transcribe)
    audio = io.BytesIO(b"fake-webm-bytes")
    audio.name = "clip.webm"
    res = auth_client.post(
        "/api/voice/stt/",
        data={"audio": audio},
        format="multipart",
    )
    assert res.status_code == 200
    assert res.json() == {"text": "combien font deux et trois"}
    assert captured["bytes"] == b"fake-webm-bytes"
    assert captured["filename"] == "clip.webm"


@override_settings(ELEVENLABS_API_KEY="", ELEVENLABS_FEMALE_VOICE_ID="x")
def test_stream_tts_raises_when_key_missing():
    with pytest.raises(el.ElevenLabsError):
        list(el.stream_tts("hi", "female"))


@override_settings(ELEVENLABS_API_KEY="k", ELEVENLABS_FEMALE_VOICE_ID="")
def test_stream_tts_raises_when_voice_missing():
    with pytest.raises(el.ElevenLabsError):
        list(el.stream_tts("hi", "female"))


@pytest.mark.django_db
def test_student_serializer_exposes_tutor_voice(auth_client, user):
    s = _make_student(user, display="Léa")
    res = auth_client.get(f"/api/students/{s.id}/")
    assert res.status_code == 200
    assert res.json().get("tutor_voice") == "female"
    res = auth_client.patch(
        f"/api/students/{s.id}/",
        data={"tutor_voice": "male"},
        format="json",
    )
    assert res.status_code == 200, res.content
    assert res.json()["tutor_voice"] == "male"
