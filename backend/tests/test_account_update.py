import pytest


@pytest.mark.django_db
def test_patch_display_name(auth_client, user):
    res = auth_client.patch("/api/auth/user/", {"display_name": "Alice B"}, format="json")
    assert res.status_code == 200, res.content
    assert res.json()["display_name"] == "Alice B"
    user.refresh_from_db()
    assert user.display_name == "Alice B"


@pytest.mark.django_db
def test_patch_email(auth_client, user):
    res = auth_client.patch("/api/auth/user/", {"email": "alice2@test.com"}, format="json")
    assert res.status_code == 200, res.content
    user.refresh_from_db()
    assert user.email == "alice2@test.com"


@pytest.mark.django_db
def test_patch_email_collision_rejected(auth_client, other_user):
    res = auth_client.patch("/api/auth/user/", {"email": other_user.email}, format="json")
    assert res.status_code == 400
    assert "email" in res.json()


@pytest.mark.django_db
def test_patch_user_unauthenticated(api):
    res = api.patch("/api/auth/user/", {"display_name": "X"}, format="json")
    assert res.status_code in (401, 403)


@pytest.mark.django_db
def test_password_change_requires_current(auth_client):
    res = auth_client.post(
        "/api/auth/password/change/",
        {"new_password1": "BrandNew!23", "new_password2": "BrandNew!23"},
        format="json",
    )
    assert res.status_code == 400


@pytest.mark.django_db
def test_password_change_success(auth_client, user):
    res = auth_client.post(
        "/api/auth/password/change/",
        {
            "old_password": "pw12345!",
            "new_password1": "BrandNew!23",
            "new_password2": "BrandNew!23",
        },
        format="json",
    )
    assert res.status_code == 200, res.content
    user.refresh_from_db()
    assert user.check_password("BrandNew!23")
