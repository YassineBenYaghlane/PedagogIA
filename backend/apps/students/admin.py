from django.contrib import admin

from .models import Student, StudentSkillState


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ("display_name", "grade", "parent", "created_at")
    list_filter = ("grade",)
    search_fields = ("display_name", "parent__email")


@admin.register(StudentSkillState)
class StudentSkillStateAdmin(admin.ModelAdmin):
    list_display = ("student", "skill", "mastery_level", "total_attempts")
    search_fields = ("student__display_name", "skill__id")
