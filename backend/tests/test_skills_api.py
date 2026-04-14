import pytest


@pytest.mark.django_db
def test_list_skills(api):
    res = api.get("/api/skills/")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 60
    assert {"id", "label", "grade", "prerequisite_ids"}.issubset(data[0].keys())


@pytest.mark.django_db
def test_retrieve_skill(api):
    res = api.get("/api/skills/add_avec_retenue_20/")
    assert res.status_code == 200
    assert res.json()["id"] == "add_avec_retenue_20"
