import pytest


@pytest.mark.django_db
def test_generate_requires_auth(api):
    res = api.get("/api/exercises/generate/?skill_id=add_avec_retenue_20&difficulty=1")
    assert res.status_code in (401, 403)


@pytest.mark.django_db
def test_generate_ok(auth_client):
    res = auth_client.get("/api/exercises/generate/?skill_id=add_avec_retenue_20&difficulty=1")
    assert res.status_code == 200
    body = res.json()
    for key in ("template_id", "skill_id", "difficulty", "type", "prompt", "answer", "params"):
        assert key in body
    assert body["skill_id"] == "add_avec_retenue_20"


@pytest.mark.django_db
def test_generate_missing_skill(auth_client):
    res = auth_client.get("/api/exercises/generate/")
    assert res.status_code == 400
