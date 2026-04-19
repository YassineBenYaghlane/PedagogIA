from django.contrib import admin

from .models import Skill, SkillPrerequisite


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ("id", "label", "grade")
    list_filter = ("grade",)
    search_fields = ("id", "label")


@admin.register(SkillPrerequisite)
class SkillPrerequisiteAdmin(admin.ModelAdmin):
    list_display = ("skill", "prerequisite")
    search_fields = ("skill__id", "prerequisite__id")
