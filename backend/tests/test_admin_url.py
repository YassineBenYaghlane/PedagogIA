import importlib

from django.test import Client
from django.urls import clear_url_caches


def _reload_urls(settings):
    clear_url_caches()
    importlib.reload(importlib.import_module(settings.ROOT_URLCONF))


def test_admin_defaults_to_standard_path(db, settings, monkeypatch):
    monkeypatch.delenv("DJANGO_ADMIN_PATH", raising=False)
    _reload_urls(settings)
    try:
        response = Client().get("/admin/", follow=False)
        assert response.status_code in (301, 302)
    finally:
        _reload_urls(settings)


def test_admin_moves_when_env_is_set(db, settings, monkeypatch):
    monkeypatch.setenv("DJANGO_ADMIN_PATH", "hidden-console/")
    _reload_urls(settings)
    try:
        client = Client()
        assert client.get("/admin/", follow=False).status_code == 404
        response = client.get("/hidden-console/", follow=False)
        assert response.status_code in (301, 302)
    finally:
        monkeypatch.delenv("DJANGO_ADMIN_PATH", raising=False)
        _reload_urls(settings)


def test_admin_env_tolerates_missing_trailing_slash(db, settings, monkeypatch):
    monkeypatch.setenv("DJANGO_ADMIN_PATH", "mgmt-xyz")
    _reload_urls(settings)
    try:
        response = Client().get("/mgmt-xyz/", follow=False)
        assert response.status_code in (301, 302)
    finally:
        monkeypatch.delenv("DJANGO_ADMIN_PATH", raising=False)
        _reload_urls(settings)
