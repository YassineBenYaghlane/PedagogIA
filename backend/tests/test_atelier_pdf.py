import base64
import io

import pytest

from apps.atelier_pdf import views as atelier_views

ENDPOINT = "/api/pdf/correct-page/"
PNG_BYTES = b"\x89PNG\r\n\x1a\nfake-page-bytes"


def _png_upload(name="page.png", payload=PNG_BYTES, content_type="image/png"):
    f = io.BytesIO(payload)
    f.name = name
    return f, content_type


class _FakeBlock:
    def __init__(self, text):
        self.type = "text"
        self.text = text


class _FakeResponse:
    def __init__(self, text):
        self.content = [_FakeBlock(text)]


def _patch_anthropic(monkeypatch, captured: dict, reply_text: str = "1) Juste. 2) Faux."):
    class _Client:
        class messages:
            @staticmethod
            def create(**kwargs):
                captured.update(kwargs)
                return _FakeResponse(reply_text)

    monkeypatch.setattr(atelier_views, "_get_client", lambda: _Client)


@pytest.mark.django_db
def test_correct_page_requires_auth(api):
    res = api.post(ENDPOINT, data={}, format="multipart")
    assert res.status_code in (401, 403)


@pytest.mark.django_db
def test_correct_page_forwards_image_block_to_anthropic(monkeypatch, auth_client):
    captured: dict = {}
    _patch_anthropic(monkeypatch, captured)

    img, ctype = _png_upload()
    res = auth_client.post(
        ENDPOINT,
        data={
            "page_image": img,
            "doc_title": "CEB 2024 Maths",
            "page_number": "3",
        },
        format="multipart",
    )
    assert res.status_code == 200, res.content
    body = res.json()
    assert body["feedback"] == "1) Juste. 2) Faux."
    assert body["model"]

    messages = captured["messages"]
    assert len(messages) == 1
    user_turn = messages[0]
    assert user_turn["role"] == "user"
    content = user_turn["content"]
    image_blocks = [b for b in content if b.get("type") == "image"]
    assert len(image_blocks) == 1
    src = image_blocks[0]["source"]
    assert src["type"] == "base64"
    assert src["media_type"] == "image/png"
    assert base64.b64decode(src["data"]) == PNG_BYTES
    text_blocks = [b for b in content if b.get("type") == "text"]
    assert text_blocks and "page 3" in text_blocks[0]["text"]
    assert "CEB 2024 Maths" in text_blocks[0]["text"]


@pytest.mark.django_db
def test_correct_page_rejects_missing_image(auth_client):
    res = auth_client.post(
        ENDPOINT,
        data={"doc_title": "x", "page_number": "1"},
        format="multipart",
    )
    assert res.status_code == 400
    assert "page_image" in res.json()


@pytest.mark.django_db
def test_correct_page_rejects_unsupported_format(auth_client):
    f = io.BytesIO(b"%PDF-1.4 not an image")
    f.name = "wrong.pdf"
    res = auth_client.post(
        ENDPOINT,
        data={
            "page_image": ("page.pdf", f, "application/pdf"),
            "doc_title": "x",
            "page_number": "1",
        },
        format="multipart",
    )
    assert res.status_code == 400
    assert "page_image" in res.json()


@pytest.mark.django_db
def test_correct_page_rejects_oversize_image(auth_client):
    huge = io.BytesIO(b"\x89PNG\r\n\x1a\n" + b"\x00" * (atelier_views.PAGE_IMAGE_MAX_BYTES + 1))
    huge.name = "huge.png"
    res = auth_client.post(
        ENDPOINT,
        data={"page_image": huge, "doc_title": "x", "page_number": "1"},
        format="multipart",
    )
    assert res.status_code == 400
    assert "page_image" in res.json()


@pytest.mark.django_db
def test_correct_page_rejects_invalid_page_number(auth_client):
    img, _ = _png_upload()
    res = auth_client.post(
        ENDPOINT,
        data={"page_image": img, "doc_title": "x", "page_number": "zero"},
        format="multipart",
    )
    assert res.status_code == 400


@pytest.mark.django_db
def test_correct_page_falls_back_when_model_returns_empty(monkeypatch, auth_client):
    captured: dict = {}
    _patch_anthropic(monkeypatch, captured, reply_text="")

    img, _ = _png_upload()
    res = auth_client.post(
        ENDPOINT,
        data={"page_image": img, "doc_title": "x", "page_number": "1"},
        format="multipart",
    )
    assert res.status_code == 200
    assert "réessayer" in res.json()["feedback"].lower()


OPEN_CHAT = "/api/pdf/open-chat/"


@pytest.mark.django_db
def test_open_chat_creates_conversation_seeded_with_feedback(auth_client, user):
    from apps.chat.models import Conversation
    from apps.students.models import Student

    student = Student.objects.create(user=user, display_name="Léo", grade="P6")

    res = auth_client.post(
        OPEN_CHAT,
        data={
            "student_id": str(student.id),
            "feedback": "a) ✓ Exact ! b) Vérifie ta retenue.",
            "doc_title": "CEB 2024",
            "page_number": 5,
        },
        format="json",
    )
    assert res.status_code == 201, res.content
    body = res.json()
    conv = Conversation.objects.get(id=body["conversation_id"])
    assert conv.student_id == student.id
    assert "CEB 2024" in conv.title
    assert "page 5" in conv.title
    msgs = list(conv.messages.all())
    assert len(msgs) == 1
    assert msgs[0].role == "assistant"
    assert "Vérifie ta retenue" in msgs[0].content


@pytest.mark.django_db
def test_open_chat_rejects_other_users_student(auth_client, other_user):
    from apps.students.models import Student

    foreign = Student.objects.create(user=other_user, display_name="X", grade="P6")
    res = auth_client.post(
        OPEN_CHAT,
        data={
            "student_id": str(foreign.id),
            "feedback": "ok",
        },
        format="json",
    )
    assert res.status_code == 403


@pytest.mark.django_db
def test_open_chat_requires_feedback(auth_client, user):
    from apps.students.models import Student

    student = Student.objects.create(user=user, display_name="X", grade="P6")
    res = auth_client.post(
        OPEN_CHAT,
        data={"student_id": str(student.id), "feedback": ""},
        format="json",
    )
    assert res.status_code == 400
