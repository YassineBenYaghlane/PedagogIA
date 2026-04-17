from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import RegisterView, SocialLoginView
from dj_rest_auth.views import LoginView, PasswordResetView
from dj_rest_auth.views import UserDetailsView as _UserDetailsView
from django.conf import settings
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle


class ThrottledLoginView(LoginView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"


class ThrottledRegisterView(RegisterView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "register"


class ThrottledPasswordResetView(PasswordResetView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset"


class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    client_class = OAuth2Client
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    @property
    def callback_url(self):
        return settings.GOOGLE_OAUTH_CALLBACK_URL


class UserDetailsView(_UserDetailsView):
    """Return 204 for anon users so the SPA bootstrap doesn't trigger
    a console-noisy 403 on first page load."""

    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response(status=204)
        return super().get(request, *args, **kwargs)
