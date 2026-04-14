from django.urls import path

from .views import generate, next_exercise

urlpatterns = [
    path("exercises/generate/", generate, name="exercises-generate"),
    path("exercises/next/", next_exercise, name="exercises-next"),
]
