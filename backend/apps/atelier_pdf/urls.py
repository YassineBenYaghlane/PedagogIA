from django.urls import path

from .views import correct_page, open_chat

urlpatterns = [
    path("pdf/correct-page/", correct_page, name="atelier-pdf-correct-page"),
    path("pdf/open-chat/", open_chat, name="atelier-pdf-open-chat"),
]
