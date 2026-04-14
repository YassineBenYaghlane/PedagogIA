from django.contrib import admin

from .models import Session


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ("id", "student", "mode", "started_at", "ended_at")
    list_filter = ("mode",)
