import os

from django.conf import settings
from django.contrib import admin
from django.http import HttpResponse, JsonResponse
from django.middleware.csrf import get_token
from django.urls import include, path
from django.views.decorators.csrf import ensure_csrf_cookie
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from apps.accounts.views import (
    GoogleLogin,
    ThrottledLoginView,
    ThrottledPasswordResetView,
    ThrottledRegisterView,
    UserDetailsView,
)

# In prod we mount the admin under a random slug so the default /admin/ 404s —
# a stolen superuser cookie is a big deal and hiding the URL raises the bar.
# Default stays "admin/" so local dev is unchanged.
_admin_path = os.environ.get("DJANGO_ADMIN_PATH", "admin/")
if not _admin_path.endswith("/"):
    _admin_path = f"{_admin_path}/"


@ensure_csrf_cookie
def csrf(request):
    get_token(request)
    return HttpResponse(status=204)


def health(_request):
    return JsonResponse({"status": "ok", "version": settings.APP_VERSION})


urlpatterns = [
    path(_admin_path, admin.site.urls),
    path("api/health/", health),
    path("api/csrf/", csrf),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema")),
    path("api/auth/user/", UserDetailsView.as_view(), name="rest_user_details"),
    path("api/auth/login/", ThrottledLoginView.as_view(), name="rest_login"),
    path(
        "api/auth/password/reset/",
        ThrottledPasswordResetView.as_view(),
        name="rest_password_reset",
    ),
    path("api/auth/registration/", ThrottledRegisterView.as_view(), name="rest_register"),
    path("api/auth/", include("dj_rest_auth.urls")),
    path("api/auth/registration/", include("dj_rest_auth.registration.urls")),
    path("api/auth/google/", GoogleLogin.as_view(), name="google_login"),
    path("api/", include("apps.skills.urls")),
    path("api/", include("apps.exercises.urls")),
    path("api/", include("apps.students.urls")),
    path("api/", include("apps.sessions.urls")),
    path("api/", include("apps.chat.urls")),
]
