from django.contrib import admin

from .models import Student, StudentSkillState


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ("display_name", "grade", "user", "created_at")
    list_filter = ("grade",)
    search_fields = ("display_name", "user__email")


@admin.register(StudentSkillState)
class StudentSkillStateAdmin(admin.ModelAdmin):
    list_display = ("student", "skill", "skill_xp", "total_attempts", "last_practiced_at")
    search_fields = ("student__display_name", "skill__id")
