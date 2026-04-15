import pytest
from django.core.management import call_command
from rest_framework.test import APIClient


@pytest.fixture(scope="session")
def django_db_setup(django_db_setup, django_db_blocker):
    with django_db_blocker.unblock():
        call_command("seed_skills")
        call_command("seed_templates")


@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def user(db, django_user_model):
    return django_user_model.objects.create_user(email="alice@test.com", password="pw12345!")


@pytest.fixture
def other_user(db, django_user_model):
    return django_user_model.objects.create_user(email="bob@test.com", password="pw12345!")


@pytest.fixture
def auth_client(api, user):
    api.force_authenticate(user)
    return api


@pytest.fixture(autouse=True)
def _stub_investigation(monkeypatch, request):
    if request.node.get_closest_marker("real_investigation"):
        return
    from apps.exercises import investigation

    def fake(attempt):
        return investigation.InvestigationResult(
            feedback_text="(stub) revoyons cette étape.",
            next_action="practice",
            next_skill_id=None,
            confidence=0.9,
            model="stub",
            strategies=[],
        )

    monkeypatch.setattr(investigation, "investigate", fake)
