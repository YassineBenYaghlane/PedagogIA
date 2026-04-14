import os

from .base import *  # noqa: F401,F403

DEBUG = False

for required in ("DJANGO_SECRET_KEY", "DATABASE_URL"):
    if not os.environ.get(required):
        raise RuntimeError(f"Missing required env var: {required}")

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
