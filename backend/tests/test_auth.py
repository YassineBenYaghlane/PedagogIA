import pytest
from django.urls import reverse


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
def test_register_login_me_logout(api):
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

    res = api.post(
        "/api/auth/login/",
        {"email": "new@example.com", "password": "SuperStrong!23"},
        format="json",
    )
    assert res.status_code == 200

    res = api.get("/api/auth/user/")
    assert res.status_code == 200
    assert res.json()["email"] == "new@example.com"

    res = api.post("/api/auth/logout/")
    assert res.status_code == 200
