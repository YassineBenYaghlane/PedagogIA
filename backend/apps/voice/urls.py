from django.urls import path

from .views import stt, tts, usage

urlpatterns = [
    path("voice/tts/", tts, name="voice-tts"),
    path("voice/stt/", stt, name="voice-stt"),
    path("voice/usage/<uuid:student_id>/", usage, name="voice-usage"),
]
