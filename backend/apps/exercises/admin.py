from django.contrib import admin

from .models import Attempt, ExerciseTemplate


@admin.register(ExerciseTemplate)
class ExerciseTemplateAdmin(admin.ModelAdmin):
    list_display = ("id", "skill", "difficulty")
    list_filter = ("difficulty", "skill__grade")
    search_fields = ("id", "skill__id")


@admin.register(Attempt)
class AttemptAdmin(admin.ModelAdmin):
    list_display = ("id", "session", "skill", "is_correct", "responded_at")
    list_filter = ("is_correct",)
