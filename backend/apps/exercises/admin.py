from django.contrib import admin

from .models import Attempt, ExerciseTemplate, TemplateSkillWeight


@admin.register(ExerciseTemplate)
class ExerciseTemplateAdmin(admin.ModelAdmin):
    list_display = ("id", "difficulty", "input_type")
    list_filter = ("difficulty", "input_type")
    search_fields = ("id",)


@admin.register(TemplateSkillWeight)
class TemplateSkillWeightAdmin(admin.ModelAdmin):
    list_display = ("template", "skill", "weight")
    search_fields = ("template__id", "skill__id")


@admin.register(Attempt)
class AttemptAdmin(admin.ModelAdmin):
    list_display = ("id", "session", "template", "is_correct", "xp_awarded", "responded_at")
    list_filter = ("is_correct",)
