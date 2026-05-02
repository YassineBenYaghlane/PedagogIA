import pytest

from apps.chat import tutor
from apps.chat.models import Conversation, Message
from apps.students.models import Student


def _make_student(user, display="A", grade="P2"):
    return Student.objects.create(user=user, display_name=display, grade=grade)


def _make_attempt(student, *, is_correct=False):
    """Create a wrong (or right) Attempt directly, bypassing the validator chain."""
    from apps.exercises.models import ExerciseTemplate
    from apps.sessions.models import Session

    session = Session.objects.create(student=student, mode="training")
    template = ExerciseTemplate.objects.first()
    return template.attempt_set.model.objects.create(
        session=session,
        template=template,
        exercise_params={"a": 7, "b": 8, "op": "+"},
        student_answer="11" if not is_correct else "15",
        correct_answer="15",
        is_correct=is_correct,
        xp_awarded=0,
    )


@pytest.mark.django_db
def test_list_conversations_starts_empty(auth_client, user):
    student = _make_student(user)
    res = auth_client.get(f"/api/students/{student.id}/conversations/")
    assert res.status_code == 200
    assert res.json() == []


@pytest.mark.django_db
def test_create_conversation_returns_full_payload(auth_client, user):
    student = _make_student(user)
    res = auth_client.post(
        f"/api/students/{student.id}/conversations/",
        data={"title": "Sur les fractions"},
        format="json",
    )
    assert res.status_code == 201, res.content
    body = res.json()
    assert body["title"] == "Sur les fractions"
    assert body["student_id"] == str(student.id)
    assert body["messages"] == []


@pytest.mark.django_db
def test_multiple_conversations_per_student(auth_client, user):
    student = _make_student(user)
    a = auth_client.post(f"/api/students/{student.id}/conversations/", format="json").json()
    b = auth_client.post(f"/api/students/{student.id}/conversations/", format="json").json()
    assert a["id"] != b["id"]
    list_res = auth_client.get(f"/api/students/{student.id}/conversations/")
    assert list_res.status_code == 200
    assert {c["id"] for c in list_res.json()} == {a["id"], b["id"]}
    assert Conversation.objects.filter(student=student).count() == 2


@pytest.mark.django_db
def test_conversation_listing_is_scoped_to_owner(auth_client, other_user):
    other = _make_student(other_user, display="X")
    res = auth_client.get(f"/api/students/{other.id}/conversations/")
    assert res.status_code == 403


@pytest.mark.django_db
def test_messages_endpoint_requires_ownership(auth_client, user, other_user, api):
    student = _make_student(user)
    conv = Conversation.objects.create(student=student)
    Message.objects.create(conversation=conv, role="student", content="hello")

    res = auth_client.get(f"/api/conversations/{conv.id}/messages/")
    assert res.status_code == 200
    assert len(res.json()) == 1

    api.force_authenticate(other_user)
    res = api.get(f"/api/conversations/{conv.id}/messages/")
    assert res.status_code == 403


@pytest.mark.django_db
def test_delete_conversation(auth_client, user, other_user, api):
    student = _make_student(user)
    conv = Conversation.objects.create(student=student, title="x")
    Message.objects.create(conversation=conv, role="student", content="hi")

    # cross-account → 403 (auth_client and api share the same instance, so use a copy)
    from rest_framework.test import APIClient

    other = APIClient()
    other.force_authenticate(other_user)
    res = other.delete(f"/api/conversations/{conv.id}/")
    assert res.status_code == 403
    assert Conversation.objects.filter(id=conv.id).exists()

    # owner → 204, cascades messages
    res = auth_client.delete(f"/api/conversations/{conv.id}/")
    assert res.status_code == 204
    assert not Conversation.objects.filter(id=conv.id).exists()
    assert not Message.objects.filter(conversation_id=conv.id).exists()


@pytest.mark.django_db
def test_conversation_detail_renames(auth_client, user):
    student = _make_student(user)
    conv = Conversation.objects.create(student=student, title="old")
    res = auth_client.patch(
        f"/api/conversations/{conv.id}/",
        data={"title": "Multiplication"},
        format="json",
    )
    assert res.status_code == 200
    conv.refresh_from_db()
    assert conv.title == "Multiplication"


@pytest.mark.django_db
def test_send_message_streams_persists_and_titles(monkeypatch, auth_client, user):
    student = _make_student(user)
    conv = Conversation.objects.create(student=student)

    def fake_stream(_conv, **_):
        yield ("chunk", "Bonjour")
        yield ("chunk", " ! ")
        yield ("chunk", "Comment tu fais ?")
        yield ("speech", "Bonjour ! Comment tu fais ?")

    monkeypatch.setattr("apps.chat.views.stream_reply", fake_stream)

    res = auth_client.post(
        f"/api/conversations/{conv.id}/messages/send/",
        data={"content": "j'ai bloqué sur 7+8"},
        format="json",
    )
    assert res.status_code == 200
    body = b"".join(res.streaming_content).decode()
    lines = [line for line in body.split("\n") if line]
    assert lines[0].startswith('{"type": "chunk"')
    assert lines[-1].startswith('{"type": "done"')
    import json as _json

    done = _json.loads(lines[-1])
    assert done["speech"] == "Bonjour ! Comment tu fais ?"

    msgs = list(conv.messages.order_by("created_at"))
    assert len(msgs) == 2
    assert msgs[0].role == "student"
    assert msgs[0].content == "j'ai bloqué sur 7+8"
    assert msgs[1].content == "Bonjour ! Comment tu fais ?"
    assert msgs[1].speech == "Bonjour ! Comment tu fais ?"

    conv.refresh_from_db()
    assert conv.title == "j'ai bloqué sur 7+8"


@pytest.mark.django_db
def test_send_message_rejects_blank(auth_client, user):
    student = _make_student(user)
    conv = Conversation.objects.create(student=student)
    res = auth_client.post(
        f"/api/conversations/{conv.id}/messages/send/",
        data={"content": "   "},
        format="json",
    )
    assert res.status_code == 400


@pytest.mark.django_db
def test_send_message_streams_error_frame(monkeypatch, auth_client, user):
    student = _make_student(user)
    conv = Conversation.objects.create(student=student)

    def boom(_conv, **_):
        raise RuntimeError("api down")
        yield  # pragma: no cover  — make it a generator

    monkeypatch.setattr("apps.chat.views.stream_reply", boom)

    res = auth_client.post(
        f"/api/conversations/{conv.id}/messages/send/",
        data={"content": "hi"},
        format="json",
    )
    body = b"".join(res.streaming_content).decode()
    assert '"type": "error"' in body
    assert conv.messages.filter(role="assistant").count() == 0


@pytest.mark.django_db
def test_open_for_attempt_creates_fresh_conv_each_time(monkeypatch, auth_client, user):
    """Each wrong attempt opens its OWN conversation thread, not a single shared one."""
    student = _make_student(user, grade="P2")
    a1 = _make_attempt(student, is_correct=False)
    a2 = _make_attempt(student, is_correct=False)

    from apps.exercises import investigation as inv_mod

    def fake_investigate(_a):
        return inv_mod.InvestigationResult(
            feedback_text="Tu as oublié la retenue.",
            next_action="redirect",
            next_skill_id="add_sans_retenue_10",
            confidence=0.9,
            model="haiku-x",
            strategies=[],
        )

    monkeypatch.setattr(inv_mod, "investigate", fake_investigate)

    r1 = auth_client.post(f"/api/attempts/{a1.id}/open-chat/").json()
    r2 = auth_client.post(f"/api/attempts/{a2.id}/open-chat/").json()
    assert r1["conversation_id"] != r2["conversation_id"]
    assert r1["next_skill_id"] == "add_sans_retenue_10"
    assert Conversation.objects.filter(student=student).count() == 2


@pytest.mark.django_db
def test_open_for_attempt_falls_back_when_investigation_fails(monkeypatch, auth_client, user):
    student = _make_student(user, grade="P2")
    attempt = _make_attempt(student, is_correct=False)

    from apps.exercises import investigation as inv_mod

    def boom(_a):
        raise RuntimeError("api down")

    monkeypatch.setattr(inv_mod, "investigate", boom)

    res = auth_client.post(f"/api/attempts/{attempt.id}/open-chat/")
    assert res.status_code == 201
    body = res.json()
    assert body["next_skill_id"] is None
    seed = Message.objects.get(id=body["seed_message_id"])
    assert seed.content == tutor.DEFAULT_OPENER


@pytest.mark.django_db
def test_open_for_attempt_rejects_correct(auth_client, user):
    student = _make_student(user, grade="P2")
    attempt = _make_attempt(student, is_correct=True)
    res = auth_client.post(f"/api/attempts/{attempt.id}/open-chat/")
    assert res.status_code == 400


@pytest.mark.django_db
def test_open_for_attempt_scoping(auth_client, other_user):
    other_student = _make_student(other_user, display="Z")
    attempt = _make_attempt(other_student, is_correct=False)
    res = auth_client.post(f"/api/attempts/{attempt.id}/open-chat/")
    assert res.status_code == 404


def test_system_prompt_includes_safety_guards():
    p = tutor.SYSTEM_PROMPT
    assert "Socratique" in p
    assert "scolaire" in p
    assert "informations personnelles" in p
    assert "français" in p.lower()


def test_system_prompt_demands_speech_sentinel():
    """The structured-TTS contract is documented in the system prompt itself."""
    p = tutor.SYSTEM_PROMPT
    assert tutor.SPEECH_SENTINEL in p
    assert "divisé par" in p
    assert "égale" in p


def _fake_stream(chunks):
    """Build a fake Anthropic stream context manager that yields the given chunks."""

    class _CM:
        def __enter__(self):
            return self

        def __exit__(self, *exc):
            return False

        @property
        def text_stream(self):
            return iter(chunks)

    return _CM()


@pytest.mark.django_db
def test_stream_reply_separates_display_and_speech(monkeypatch, user):
    student = _make_student(user)
    conv = Conversation.objects.create(student=student)
    conv.messages.create(role="student", content="combien font 16 / 8 ?")

    fake_chunks = [
        "Réfléchis : ",
        "16 / 8 = ?",
        f"\n{tutor.SPEECH_SENTINEL}\n",
        "Réfléchis : seize divisé par huit égale ?",
    ]

    class _Client:
        class messages:
            @staticmethod
            def stream(**_):
                return _fake_stream(fake_chunks)

    monkeypatch.setattr(tutor, "_get_client", lambda: _Client)
    events = list(tutor.stream_reply(conv))
    chunks = [text for kind, text in events if kind == "chunk"]
    speech = [text for kind, text in events if kind == "speech"]
    display = "".join(chunks)
    assert tutor.SPEECH_SENTINEL not in display
    assert "16 / 8" in display
    assert speech == ["Réfléchis : seize divisé par huit égale ?"]


@pytest.mark.django_db
def test_stream_reply_handles_split_sentinel(monkeypatch, user):
    """Sentinel can be split across token boundaries — must still be detected."""
    student = _make_student(user)
    conv = Conversation.objects.create(student=student)
    conv.messages.create(role="student", content="x")

    s = tutor.SPEECH_SENTINEL
    fake_chunks = ["Bonjour ! ", s[:4], s[4:], " parlé"]

    class _Client:
        class messages:
            @staticmethod
            def stream(**_):
                return _fake_stream(fake_chunks)

    monkeypatch.setattr(tutor, "_get_client", lambda: _Client)
    events = list(tutor.stream_reply(conv))
    display = "".join(t for k, t in events if k == "chunk")
    speech = next(t for k, t in events if k == "speech")
    assert s not in display
    assert display.strip() == "Bonjour !"
    assert speech == "parlé"


@pytest.mark.django_db
def test_stream_reply_strips_trailing_sentinel_echo(monkeypatch, user):
    """Some model turns echo the sentinel after the speech version — strip it."""
    student = _make_student(user)
    conv = Conversation.objects.create(student=student)
    conv.messages.create(role="student", content="x")

    s = tutor.SPEECH_SENTINEL
    fake_chunks = ["Calcul : ", "16 / 8.", f"\n{s}\n", "Calcul : seize divisé par huit.", f"\n{s}"]

    class _Client:
        class messages:
            @staticmethod
            def stream(**_):
                return _fake_stream(fake_chunks)

    monkeypatch.setattr(tutor, "_get_client", lambda: _Client)
    events = list(tutor.stream_reply(conv))
    speech = next(t for k, t in events if k == "speech")
    assert s not in speech
    assert speech == "Calcul : seize divisé par huit."


@pytest.mark.django_db
def test_stream_reply_falls_back_when_sentinel_missing(monkeypatch, user):
    """If the model forgets the sentinel, display gets the full text and speech is empty."""
    student = _make_student(user)
    conv = Conversation.objects.create(student=student)
    conv.messages.create(role="student", content="x")

    fake_chunks = ["Salut ", "petit", " explorateur."]

    class _Client:
        class messages:
            @staticmethod
            def stream(**_):
                return _fake_stream(fake_chunks)

    monkeypatch.setattr(tutor, "_get_client", lambda: _Client)
    events = list(tutor.stream_reply(conv))
    display = "".join(t for k, t in events if k == "chunk")
    speech = next(t for k, t in events if k == "speech")
    assert display == "Salut petit explorateur."
    assert speech == ""


def test_app_context_names_collegia():
    """The bot must know the app name and core concepts to avoid hallucinating."""
    ctx = tutor.APP_CONTEXT
    assert "CollegIA" in ctx
    assert "FWB" in ctx
    assert "skill tree" in ctx.lower() or "arbre" in ctx
    assert "Entraînement" in ctx and "Automatismes" in ctx


@pytest.mark.django_db
def test_open_for_attempt_marks_kind_exercice_with_anchors(monkeypatch, auth_client, user):
    student = _make_student(user, grade="P3")
    attempt = _make_attempt(student, is_correct=False)

    from apps.exercises import investigation as inv_mod

    monkeypatch.setattr(
        inv_mod,
        "investigate",
        lambda _a: inv_mod.InvestigationResult(
            feedback_text="hint",
            next_action="practice",
            next_skill_id=None,
            confidence=0.9,
            model="haiku-x",
            strategies=[],
        ),
    )

    res = auth_client.post(f"/api/attempts/{attempt.id}/open-chat/")
    assert res.status_code == 201
    conv = Conversation.objects.get(id=res.json()["conversation_id"])
    assert conv.kind == "exercice"
    assert conv.anchor_attempt_id == attempt.id
    assert conv.anchor_skill_id is not None


@pytest.mark.django_db
def test_create_conversation_defaults_to_free_kind(auth_client, user):
    student = _make_student(user)
    res = auth_client.post(f"/api/students/{student.id}/conversations/", format="json")
    assert res.status_code == 201
    assert res.json()["kind"] == "free"


@pytest.mark.django_db
def test_system_blocks_branch_on_kind_and_attempt_presence(user):
    """Free → free block. Exercice + anchor attempt → AFTER (mentions Réessayer).
    Exercice without attempt → BEFORE (Socratic pre-answer guidance)."""
    from apps.chat.models import KIND_EXERCICE, KIND_FREE
    from apps.skills.models import Skill

    student = Student.objects.create(user=user, display_name="Zoé", grade="P4")
    skill = Skill.objects.first()

    free = Conversation.objects.create(student=student, kind=KIND_FREE, title="x")
    before = Conversation.objects.create(
        student=student,
        kind=KIND_EXERCICE,
        title="y",
        anchor_skill=skill,
        anchor_exercise_prompt="7 + 8 = ?",
        anchor_exercise_params={"a": 7, "b": 8, "op": "+"},
    )
    after_attempt = _make_attempt(student, is_correct=False)
    after = Conversation.objects.create(
        student=student,
        kind=KIND_EXERCICE,
        title="z",
        anchor_skill=skill,
        anchor_attempt=after_attempt,
    )

    def text_of(c):
        return "\n\n".join(b["text"] for b in tutor._system_blocks(c))

    free_text = text_of(free)
    before_text = text_of(before)
    after_text = text_of(after)

    assert "Mode : chat libre" in free_text
    assert "Mode : aide à l'exercice (avant la réponse)" in before_text
    assert "Mode : aide à l'exercice (après une mauvaise réponse)" in after_text
    assert "Réessayer" in after_text
    assert "Réessayer" not in before_text
    assert "n'a pas encore répondu" in before_text
    assert "Réponse de l'élève" in after_text
    assert "niveau P4" in free_text
    assert "Zoé" in free_text
    if skill is not None:
        assert skill.id in before_text and skill.id in after_text


@pytest.mark.django_db
def test_profile_block_includes_progress_and_activity(user):
    """Always-on profile block surfaces rank, mastery counts, and 7-day activity."""
    student = Student.objects.create(
        user=user,
        display_name="Léo",
        grade="P3",
        xp=120,
        rank="explorateur",
        current_streak=3,
        best_streak=5,
        daily_goal=5,
    )
    block = tutor._profile_block(student)
    assert "Rang : explorateur" in block
    assert "120 XP" in block
    assert "Série actuelle : 3" in block
    assert "record 5" in block
    assert "Maîtrise du référentiel" in block
    assert "7 derniers jours" in block
