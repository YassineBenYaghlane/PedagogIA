import pytest
from django.core.cache import cache
from rest_framework.test import APIClient


@pytest.fixture(autouse=True)
def _clear_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.mark.django_db
def test_login_throttled_after_ten_attempts(api):
    payload = {"email": "nobody@test.com", "password": "wrong"}

    for _ in range(10):
        res = api.post("/api/auth/login/", payload, format="json")
        assert res.status_code == 400, res.content

    res = api.post("/api/auth/login/", payload, format="json")
    assert res.status_code == 429
    assert "Retry-After" in res.headers


@pytest.mark.django_db
def test_register_throttled_after_five_attempts():
    # Each anonymous attempt uses a fresh client so the session cookie
    # from a successful signup doesn't re-key the throttle bucket.
    for i in range(5):
        res = APIClient().post(
            "/api/auth/registration/",
            {
                "email": f"user{i}@test.com",
                "password1": "SuperStrong!23",
                "password2": "SuperStrong!23",
                "display_name": f"User{i}",
            },
            format="json",
        )
        assert res.status_code in (201, 200, 400), res.content

    res = APIClient().post(
        "/api/auth/registration/",
        {
            "email": "blocked@test.com",
            "password1": "SuperStrong!23",
            "password2": "SuperStrong!23",
            "display_name": "Blocked",
        },
        format="json",
    )
    assert res.status_code == 429
    assert "Retry-After" in res.headers
