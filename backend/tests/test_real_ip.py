import pytest
from django.test import RequestFactory, override_settings

from apps.common.middleware import CloudflareRealIPMiddleware, _is_cloudflare


def test_cloudflare_range_membership():
    assert _is_cloudflare("162.158.1.1")
    assert _is_cloudflare("104.16.0.1")
    assert _is_cloudflare("2606:4700::1")
    assert not _is_cloudflare("8.8.8.8")
    assert not _is_cloudflare("46.225.142.212")  # the prod Hetzner IP
    assert not _is_cloudflare("not-an-ip")


@override_settings(TRUST_CLOUDFLARE_REAL_IP=True)
def test_rewrites_remote_addr_when_peer_is_cloudflare():
    factory = RequestFactory()
    mw = CloudflareRealIPMiddleware(lambda r: r)
    req = factory.get(
        "/",
        REMOTE_ADDR="162.158.1.1",
        HTTP_CF_CONNECTING_IP="203.0.113.42",
    )
    mw(req)
    assert req.META["REMOTE_ADDR"] == "203.0.113.42"


@override_settings(TRUST_CLOUDFLARE_REAL_IP=True)
def test_ignores_header_when_peer_is_not_cloudflare():
    factory = RequestFactory()
    mw = CloudflareRealIPMiddleware(lambda r: r)
    req = factory.get(
        "/",
        REMOTE_ADDR="8.8.8.8",
        HTTP_CF_CONNECTING_IP="203.0.113.42",
    )
    mw(req)
    assert req.META["REMOTE_ADDR"] == "8.8.8.8"


@override_settings(TRUST_CLOUDFLARE_REAL_IP=False)
def test_disabled_leaves_remote_addr_alone():
    factory = RequestFactory()
    mw = CloudflareRealIPMiddleware(lambda r: r)
    req = factory.get(
        "/",
        REMOTE_ADDR="162.158.1.1",
        HTTP_CF_CONNECTING_IP="203.0.113.42",
    )
    # Middleware reads the setting at __init__, so re-instantiate under override:
    mw = CloudflareRealIPMiddleware(lambda r: r)
    mw(req)
    assert req.META["REMOTE_ADDR"] == "162.158.1.1"


@pytest.mark.django_db
@override_settings(TRUST_CLOUDFLARE_REAL_IP=True)
def test_throttle_keys_on_real_ip_through_cloudflare(api):
    # Two bursts from the SAME Cloudflare edge IP but DIFFERENT real clients
    # must not share a throttle bucket.
    payload = {"email": "nobody@example.com", "password": "wrong"}
    for _ in range(5):
        res = api.post(
            "/api/auth/login/",
            payload,
            format="json",
            REMOTE_ADDR="162.158.1.1",
            HTTP_CF_CONNECTING_IP="203.0.113.10",
        )
        assert res.status_code == 400
    for _ in range(5):
        res = api.post(
            "/api/auth/login/",
            payload,
            format="json",
            REMOTE_ADDR="162.158.1.1",
            HTTP_CF_CONNECTING_IP="203.0.113.20",
        )
        assert res.status_code == 400
