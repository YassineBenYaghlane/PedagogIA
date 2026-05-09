import re

import pytest
from django.core import mail
from django.core.cache import cache
from django.urls import reverse
from rest_framework.test import APIClient


@pytest.fixture(autouse=True)
def _isolate_throttle_and_outbox(settings):
    settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
    cache.clear()
    mail.outbox = []
    yield
    cache.clear()


def _verify_url_from_outbox():
    body = mail.outbox[-1].body
    match = re.search(r"/auth/verify/([^\s]+)", body)
    assert match, f"verification link not found in email body: {body!r}"
    return match.group(1)


@pytest.mark.django_db
def test_csrf_endpoint_sets_cookie(api):
    res = api.get("/api/csrf/")
    assert res.status_code == 204
    assert "csrftoken" in res.cookies


@pytest.mark.django_db
def test_google_login_endpoint_is_mounted():
    assert reverse("google_login") == "/api/auth/google/"


@pytest.mark.django_db
def test_user_details_returns_204_for_anon(api):
    res = api.get("/api/auth/user/")
    assert res.status_code == 204


@pytest.mark.django_db
def test_signup_does_not_log_in_until_email_is_verified(api, settings):
    settings.FRONTEND_URL = "https://collegia.test"

    res = api.post(
        "/api/auth/registration/",
        {
            "email": "new@example.com",
            "password1": "SuperStrong!23",
            "password2": "SuperStrong!23",
            "display_name": "Alice",
        },
        format="json",
    )
    assert res.status_code in (200, 201), res.content

    res = api.get("/api/auth/user/")
    assert res.status_code == 204

    res = api.post(
        "/api/auth/login/",
        {"email": "new@example.com", "password": "SuperStrong!23"},
        format="json",
    )
    assert res.status_code == 400, res.content

    assert len(mail.outbox) == 1
    email = mail.outbox[0]
    assert email.to == ["new@example.com"]
    assert "CollegIA" in email.subject
    assert email.body.startswith("Bonjour Alice"), email.body
    assert "https://collegia.test/auth/verify/" in email.body

    key = _verify_url_from_outbox()
    res = api.post("/api/auth/registration/verify-email/", {"key": key}, format="json")
    assert res.status_code == 200, res.content

    res = api.post(
        "/api/auth/login/",
        {"email": "new@example.com", "password": "SuperStrong!23"},
        format="json",
    )
    assert res.status_code == 200, res.content

    res = api.get("/api/auth/user/")
    assert res.status_code == 200
    assert res.json()["email"] == "new@example.com"

    res = api.post("/api/auth/logout/")
    assert res.status_code == 200


@pytest.mark.django_db
def test_resend_verification_email_issues_a_fresh_link():
    api = APIClient()
    api.post(
        "/api/auth/registration/",
        {
            "email": "resend@example.com",
            "password1": "SuperStrong!23",
            "password2": "SuperStrong!23",
            "display_name": "Bob",
        },
        format="json",
    )
    assert len(mail.outbox) == 1

    res = APIClient().post(
        "/api/auth/registration/resend-email/",
        {"email": "resend@example.com"},
        format="json",
    )
    assert res.status_code == 200, res.content
    assert len(mail.outbox) == 2

    new_key = _verify_url_from_outbox()
    res = APIClient().post("/api/auth/registration/verify-email/", {"key": new_key}, format="json")
    assert res.status_code == 200, res.content


@pytest.mark.django_db
def test_register_duplicate_email_returns_400_not_500(django_user_model):
    """OAuth-created users can have an unverified EmailAddress row that
    allauth's pre-flight duplicate check skips — without this guard the
    duplicate hits the UNIQUE constraint at INSERT and surfaces as a 500."""
    django_user_model.objects.create_user(email="taken@example.com", password="pw12345!")

    res = APIClient().post(
        "/api/auth/registration/",
        {
            "email": "taken@example.com",
            "password1": "SuperStrong!23",
            "password2": "SuperStrong!23",
            "display_name": "Dup",
        },
        format="json",
    )
    assert res.status_code == 400, res.content
    body = res.json()
    assert "email" in body
    assert "already" in body["email"][0].lower()


@pytest.mark.django_db
def test_grandfathered_user_can_log_in_without_verification(django_user_model):
    """The 0002 migration runs on the test DB, but it's a one-shot data migration
    and pytest-django creates users post-migration via create_user. Replicate the
    grandfather behavior explicitly so the assertion is honest."""
    from allauth.account.models import EmailAddress

    user = django_user_model.objects.create_user(
        email="legacy@example.com", password="SuperStrong!23"
    )
    EmailAddress.objects.create(user=user, email=user.email, verified=True, primary=True)

    res = APIClient().post(
        "/api/auth/login/",
        {"email": "legacy@example.com", "password": "SuperStrong!23"},
        format="json",
    )
    assert res.status_code == 200, res.content
