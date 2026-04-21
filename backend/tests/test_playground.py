import pytest
from django.test import override_settings

from apps.exercises.models import ExerciseTemplate


@pytest.mark.django_db
def test_playground_templates_requires_auth(api):
    res = api.get("/api/exercises/playground/templates/")
    assert res.status_code in (401, 403)


@pytest.mark.django_db
@override_settings(ENVIRONMENT="prod")
def test_playground_templates_hidden_outside_dev(auth_client):
    res = auth_client.get("/api/exercises/playground/templates/")
    assert res.status_code == 404


@pytest.mark.django_db
@override_settings(ENVIRONMENT="prod")
def test_playground_templates_hidden_even_for_staff_outside_dev(api, django_user_model):
    user = django_user_model.objects.create_user(
        email="admin@test.com", password="pw12345!", is_staff=True
    )
    api.force_authenticate(user)
    res = api.get("/api/exercises/playground/templates/")
    assert res.status_code == 404


@pytest.mark.django_db
@override_settings(ENVIRONMENT="prod")
def test_playground_instantiate_hidden_outside_dev(auth_client):
    tpl = ExerciseTemplate.objects.first()
    res = auth_client.post(
        "/api/exercises/playground/instantiate/",
        {"template_id": tpl.id},
        format="json",
    )
    assert res.status_code == 404


@pytest.mark.django_db
@override_settings(ENVIRONMENT="dev")
def test_playground_templates_lists_all(auth_client):
    res = auth_client.get("/api/exercises/playground/templates/")
    assert res.status_code == 200
    body = res.json()
    assert isinstance(body, list)
    assert len(body) == ExerciseTemplate.objects.count()
    first = body[0]
    for key in ("id", "skill_ids", "grades", "difficulty", "input_type", "type", "template"):
        assert key in first


@pytest.mark.django_db
@override_settings(ENVIRONMENT="dev")
def test_playground_templates_filters(auth_client):
    res = auth_client.get("/api/exercises/playground/templates/?input_type=symbol")
    assert res.status_code == 200
    assert all(t["input_type"] == "symbol" for t in res.json())

    res = auth_client.get("/api/exercises/playground/templates/?grade=P3")
    assert res.status_code == 200
    assert all("P3" in t["grades"] for t in res.json())

    res = auth_client.get("/api/exercises/playground/templates/?difficulty=1")
    assert res.status_code == 200
    assert all(t["difficulty"] == 1 for t in res.json())


@pytest.mark.django_db
@override_settings(ENVIRONMENT="dev")
def test_playground_templates_rejects_bad_input_type(auth_client):
    res = auth_client.get("/api/exercises/playground/templates/?input_type=nope")
    assert res.status_code == 400


@pytest.mark.django_db
@override_settings(ENVIRONMENT="dev")
def test_playground_instantiate_ok(auth_client):
    tpl = ExerciseTemplate.objects.filter(input_type="number").first()
    res = auth_client.post(
        "/api/exercises/playground/instantiate/",
        {"template_id": tpl.id},
        format="json",
    )
    assert res.status_code == 200, res.content
    body = res.json()
    for key in ("template_id", "input_type", "prompt", "params", "answer"):
        assert key in body
    assert body["template_id"] == tpl.id
    assert "signature" not in body


@pytest.mark.django_db
@override_settings(ENVIRONMENT="dev")
def test_playground_instantiate_applies_override(auth_client):
    tpl = ExerciseTemplate.objects.filter(template__type="comparison").first()
    override = {"a_min": 7, "a_max": 7, "b_min": 7, "b_max": 7}
    res = auth_client.post(
        "/api/exercises/playground/instantiate/",
        {"template_id": tpl.id, "params_override": override},
        format="json",
    )
    assert res.status_code == 200, res.content
    body = res.json()
    assert body["params"]["a"] == 7
    assert body["params"]["b"] == 7
    assert body["answer"] == "="
    assert body["effective_template_params"]["a_min"] == 7


@pytest.mark.django_db
@override_settings(ENVIRONMENT="dev")
def test_playground_instantiate_rejects_unknown_template(auth_client):
    res = auth_client.post(
        "/api/exercises/playground/instantiate/",
        {"template_id": "does_not_exist"},
        format="json",
    )
    assert res.status_code == 404


@pytest.mark.django_db
@override_settings(ENVIRONMENT="dev")
def test_playground_instantiate_requires_template_id(auth_client):
    res = auth_client.post("/api/exercises/playground/instantiate/", {}, format="json")
    assert res.status_code == 400


@pytest.mark.django_db
@override_settings(ENVIRONMENT="dev")
def test_playground_instantiate_rejects_bad_override(auth_client):
    tpl = ExerciseTemplate.objects.first()
    res = auth_client.post(
        "/api/exercises/playground/instantiate/",
        {"template_id": tpl.id, "params_override": "nope"},
        format="json",
    )
    assert res.status_code == 400


@pytest.mark.django_db
@override_settings(ENVIRONMENT="dev")
def test_playground_instantiate_surfaces_generator_errors(auth_client):
    tpl = ExerciseTemplate.objects.filter(template__type="computation").first()
    res = auth_client.post(
        "/api/exercises/playground/instantiate/",
        {
            "template_id": tpl.id,
            "params_override": {"a_min": 99999, "a_max": 99999, "result_max": 1},
        },
        format="json",
    )
    assert res.status_code == 400
