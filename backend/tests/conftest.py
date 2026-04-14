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
def parent(db, django_user_model):
    return django_user_model.objects.create_user(email="alice@test.com", password="pw12345!")


@pytest.fixture
def other_parent(db, django_user_model):
    return django_user_model.objects.create_user(email="bob@test.com", password="pw12345!")


@pytest.fixture
def auth_client(api, parent):
    api.force_authenticate(parent)
    return api
