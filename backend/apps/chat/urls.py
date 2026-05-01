from django.urls import path

from .views import (
    conversation_detail,
    conversations_for_student,
    messages,
    open_for_attempt,
    open_for_exercise,
    send_message,
)

urlpatterns = [
    path("exercises/open-chat/", open_for_exercise, name="chat-open-for-exercise"),
    path(
        "students/<uuid:student_id>/conversations/",
        conversations_for_student,
        name="chat-conversations-for-student",
    ),
    path(
        "conversations/<uuid:conversation_id>/",
        conversation_detail,
        name="chat-conversation-detail",
    ),
    path(
        "conversations/<uuid:conversation_id>/messages/",
        messages,
        name="chat-messages",
    ),
    path(
        "conversations/<uuid:conversation_id>/messages/send/",
        send_message,
        name="chat-send-message",
    ),
    path(
        "attempts/<uuid:attempt_id>/open-chat/",
        open_for_attempt,
        name="chat-open-for-attempt",
    ),
]
