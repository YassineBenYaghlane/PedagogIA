from django.contrib import admin

from .models import Conversation, Message


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ("id", "student", "created_at", "updated_at")
    search_fields = ("student__display_name",)
    raw_id_fields = ("student",)


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("id", "conversation", "role", "created_at", "model")
    list_filter = ("role", "model")
    raw_id_fields = ("conversation", "context_attempt", "context_skill")
    readonly_fields = ("created_at",)
