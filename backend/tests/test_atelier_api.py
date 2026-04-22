import pytest
from django.test import override_settings


@pytest.mark.django_db
def test_audit_requires_auth(api):
    res = api.get("/api/exercises/audit/")
    assert res.status_code in (401, 403)


@pytest.mark.django_db
@override_settings(ENVIRONMENT="prod")
def test_audit_hidden_in_prod_for_non_staff(auth_client):
    res = auth_client.get("/api/exercises/audit/")
    assert res.status_code == 404


@pytest.mark.django_db
@override_settings(ENVIRONMENT="dev")
def test_audit_returns_skills_in_dev(auth_client):
    res = auth_client.get("/api/exercises/audit/")
    assert res.status_code == 200
    body = res.json()
    assert "skills" in body
    assert "meta" in body
    assert len(body["skills"]) > 0
    sample = next(iter(body["skills"].values()))
    for key in ("id", "label", "grade", "template_count", "status"):
        assert key in sample


@pytest.mark.django_db
@override_settings(ENVIRONMENT="dev")
def test_skill_detail_lists_templates(auth_client):
    res = auth_client.get("/api/exercises/audit/skill/add_avec_retenue_20/")
    assert res.status_code == 200
    body = res.json()
    assert body["skill"]["id"] == "add_avec_retenue_20"
    assert isinstance(body["templates"], list)
    assert len(body["templates"]) > 0
    tpl = body["templates"][0]
    for key in ("id", "difficulty", "input_type", "template_type"):
        assert key in tpl


@pytest.mark.django_db
@override_settings(ENVIRONMENT="dev")
def test_skill_detail_404_for_unknown_skill(auth_client):
    res = auth_client.get("/api/exercises/audit/skill/__nope__/")
    assert res.status_code == 404


@pytest.mark.django_db
@override_settings(ENVIRONMENT="dev")
def test_template_preview_returns_prompt_and_answer(auth_client):
    from apps.exercises.models import ExerciseTemplate

    tpl = ExerciseTemplate.objects.first()
    res = auth_client.get(f"/api/exercises/templates/{tpl.id}/preview/")
    assert res.status_code == 200
    body = res.json()
    assert body["template_id"] == tpl.id
    assert "prompt" in body or "error" in body
    if "error" not in body:
        assert "answer" in body
        assert "params" in body


@pytest.mark.django_db
@override_settings(ENVIRONMENT="prod")
def test_template_preview_hidden_in_prod(auth_client):
    from apps.exercises.models import ExerciseTemplate

    tpl = ExerciseTemplate.objects.first()
    res = auth_client.get(f"/api/exercises/templates/{tpl.id}/preview/")
    assert res.status_code == 404
