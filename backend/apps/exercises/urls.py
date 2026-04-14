from django.urls import path

from .views import generate

urlpatterns = [
    path("exercises/generate/", generate, name="exercises-generate"),
]
