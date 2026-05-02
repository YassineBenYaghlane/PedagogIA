from django.urls import path

from .views import stt, tts

urlpatterns = [
    path("voice/tts/", tts, name="voice-tts"),
    path("voice/stt/", stt, name="voice-stt"),
]
