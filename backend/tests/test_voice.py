import io

import pytest
from django.test.utils import override_settings

from apps.voice import elevenlabs as el
from apps.voice import views as voice_views


@pytest.mark.django_db
def test_tts_requires_auth(api):
    res = api.post("/api/voice/tts/", data={"text": "Bonjour"}, format="json")
    assert res.status_code in (401, 403)


@pytest.mark.django_db
def test_tts_validates_inputs(monkeypatch, auth_client):
    res = auth_client.post("/api/voice/tts/", data={"text": ""}, format="json")
    assert res.status_code == 400
    res = auth_client.post(
        "/api/voice/tts/",
        data={"text": "Bonjour", "voice": "robot"},
        format="json",
    )
    assert res.status_code == 400


@pytest.mark.django_db
def test_tts_streams_audio(monkeypatch, auth_client):
    captured = {}

    def fake_stream(text, gender):
        captured["text"] = text
        captured["gender"] = gender
        yield b"\x00\x01"
        yield b"\x02\x03"

    monkeypatch.setattr(voice_views, "stream_tts", fake_stream)
    res = auth_client.post(
        "/api/voice/tts/",
        data={"text": "Salut", "voice": "male"},
        format="json",
    )
    assert res.status_code == 200
    assert res["Content-Type"].startswith("audio/mpeg")
    assert b"".join(res.streaming_content) == b"\x00\x01\x02\x03"
    assert captured == {"text": "Salut", "gender": "male"}


@pytest.mark.django_db
def test_tts_defaults_to_female(monkeypatch, auth_client):
    captured = {}

    def fake_stream(text, gender):
        captured["gender"] = gender
        yield b""

    monkeypatch.setattr(voice_views, "stream_tts", fake_stream)
    res = auth_client.post("/api/voice/tts/", data={"text": "Salut"}, format="json")
    b"".join(res.streaming_content)
    assert captured["gender"] == "female"


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
    from apps.students.models import Student

    s = Student.objects.create(user=user, display_name="Léa", grade="P2")
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
