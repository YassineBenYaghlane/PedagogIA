from django.test import Client


def test_health_returns_status_and_version(db, settings):
    response = Client().get("/api/health/")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["version"] == settings.APP_VERSION
