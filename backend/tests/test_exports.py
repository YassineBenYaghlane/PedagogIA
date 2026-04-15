import json

import pytest


@pytest.fixture
def student(auth_client):
    res = auth_client.post("/api/students/", {"display_name": "Léo", "grade": "P2"}, format="json")
    return res.json()


@pytest.mark.django_db
def test_export_json_returns_payload(auth_client, student):
    res = auth_client.get(f"/api/students/{student['id']}/export.json/")
    assert res.status_code == 200
    assert res["Content-Type"].startswith("application/json")
    assert "attachment" in res["Content-Disposition"]
    payload = json.loads(res.content)
    assert payload["student"]["id"] == student["id"]
    assert payload["sessions"] == []
    assert payload["attempts"] == []


@pytest.mark.django_db
def test_export_pdf_returns_pdf(auth_client, student):
    res = auth_client.get(f"/api/students/{student['id']}/export.pdf/")
    assert res.status_code == 200
    assert res["Content-Type"] == "application/pdf"
    assert "attachment" in res["Content-Disposition"]
    assert res.content[:4] == b"%PDF"


@pytest.mark.django_db
def test_exports_scoped_to_owner(auth_client, api, other_user, student):
    api.force_authenticate(other_user)
    assert api.get(f"/api/students/{student['id']}/export.json/").status_code == 404
    assert api.get(f"/api/students/{student['id']}/export.pdf/").status_code == 404
