from ipaddress import ip_address, ip_network

from django.conf import settings

CLOUDFLARE_IPV4 = [
    "173.245.48.0/20",
    "103.21.244.0/22",
    "103.22.200.0/22",
    "103.31.4.0/22",
    "141.101.64.0/18",
    "108.162.192.0/18",
    "190.93.240.0/20",
    "188.114.96.0/20",
    "197.234.240.0/22",
    "198.41.128.0/17",
    "162.158.0.0/15",
    "104.16.0.0/13",
    "104.24.0.0/14",
    "172.64.0.0/13",
    "131.0.72.0/22",
]

CLOUDFLARE_IPV6 = [
    "2400:cb00::/32",
    "2606:4700::/32",
    "2803:f800::/32",
    "2405:b500::/32",
    "2405:8100::/32",
    "2a06:98c0::/29",
    "2c0f:f248::/32",
]


def _parse_networks(ranges):
    return [ip_network(r) for r in ranges]


_CF_NETS = _parse_networks(CLOUDFLARE_IPV4 + CLOUDFLARE_IPV6)


def _is_cloudflare(ip_str):
    try:
        ip = ip_address(ip_str)
    except ValueError:
        return False
    return any(ip in net for net in _CF_NETS)


class CloudflareRealIPMiddleware:
    """Rewrite REMOTE_ADDR from CF-Connecting-IP when the request came through
    a Cloudflare edge. Keeps DRF throttling keyed on the real client IP instead
    of the edge's IP (which would collapse all traffic into ~a dozen buckets).
    Requests from non-Cloudflare peers are left untouched so the header can't
    be spoofed by anyone hitting the origin directly.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self.enabled = getattr(settings, "TRUST_CLOUDFLARE_REAL_IP", False)

    def __call__(self, request):
        if self.enabled:
            peer = request.META.get("REMOTE_ADDR", "")
            real_ip = request.META.get("HTTP_CF_CONNECTING_IP")
            if real_ip and _is_cloudflare(peer):
                request.META["REMOTE_ADDR"] = real_ip
        return self.get_response(request)
