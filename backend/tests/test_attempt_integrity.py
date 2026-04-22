import threading

import pytest
from django.core import signing
from django.db import connections

from apps.exercises.models import Attempt, ExerciseTemplate
from apps.exercises.services import ANSWER_SALT, generate_exercise, record_attempt
from apps.sessions.models import Session
from apps.students.models import Student


def _answer(signature: str) -> str:
    return str(signing.loads(signature, salt=ANSWER_SALT)["answer"])


def _first_skill_with_template():
    template = ExerciseTemplate.objects.filter(skills__grade="P1").first()
    assert template is not None
    skill = template.skills.first()
    assert skill is not None
    return skill, template


@pytest.mark.django_db
def test_replay_signature_returns_409(auth_client, user):
    student = Student.objects.create(user=user, display_name="A", grade="P1")
    skill, template = _first_skill_with_template()
    session = Session.objects.create(student=student, mode="training")

    ex = generate_exercise(skill.id, template.difficulty)
    payload = {"signature": ex["signature"], "student_answer": _answer(ex["signature"])}

    first = auth_client.post(f"/api/sessions/{session.id}/attempts/", payload, format="json")
    assert first.status_code == 201
    xp_after_first = first.json()["gamification"]["xp_total"]

    replay = auth_client.post(f"/api/sessions/{session.id}/attempts/", payload, format="json")
    assert replay.status_code == 409

    assert Attempt.objects.filter(session=session).count() == 1
    student.refresh_from_db()
    assert student.xp == xp_after_first


@pytest.mark.django_db(transaction=True)
def test_concurrent_attempts_no_lost_xp(django_user_model):
    user = django_user_model.objects.create_user(email="conc@test.com", password="pw12345!")
    student = Student.objects.create(user=user, display_name="Conc", grade="P1")
    skill, template = _first_skill_with_template()
    session = Session.objects.create(student=student, mode="training")

    ex_a = generate_exercise(skill.id, template.difficulty)
    for _ in range(50):
        ex_b = generate_exercise(skill.id, template.difficulty)
        if ex_b["signature"] != ex_a["signature"]:
            break
    else:
        pytest.skip("could not generate two distinct signatures")

    session_id = session.id
    barrier = threading.Barrier(2)
    deltas: list[int] = []
    errors: list[BaseException] = []

    def worker(ex):
        try:
            barrier.wait(timeout=5)
            s = Session.objects.get(pk=session_id)
            _, gamif = record_attempt(
                session=s, signature=ex["signature"], student_answer=_answer(ex["signature"])
            )
            deltas.append(gamif["xp_delta"])
        except BaseException as exc:
            errors.append(exc)
        finally:
            connections.close_all()

    t1 = threading.Thread(target=worker, args=(ex_a,))
    t2 = threading.Thread(target=worker, args=(ex_b,))
    t1.start()
    t2.start()
    t1.join(timeout=10)
    t2.join(timeout=10)

    assert not errors, errors
    assert len(deltas) == 2

    student.refresh_from_db()
    assert student.xp == sum(deltas)
    assert Attempt.objects.filter(session=session).count() == 2
