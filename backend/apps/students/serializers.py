from rest_framework import serializers

from .models import Student, StudentSkillState


class StudentNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ("id", "display_name", "grade", "created_at")
        read_only_fields = ("id", "created_at")


class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ("id", "display_name", "grade", "created_at")
        read_only_fields = ("id", "created_at")


class StudentSkillStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentSkillState
        fields = (
            "student",
            "skill",
            "mastery_level",
            "consecutive_correct",
            "total_attempts",
            "last_practiced_at",
            "updated_at",
        )
        read_only_fields = fields
