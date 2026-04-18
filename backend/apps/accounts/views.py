from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import RegisterView, SocialLoginView
from dj_rest_auth.views import LoginView, PasswordResetView
from dj_rest_auth.views import UserDetailsView as _UserDetailsView
from django.conf import settings
from rest_framework.permissions import AllowAny, IsAuthenticated
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
    """GET returns 204 for anon users (silences the SPA bootstrap 403);
    mutating methods require authentication."""

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response(status=204)
        return super().get(request, *args, **kwargs)
