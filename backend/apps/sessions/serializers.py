from rest_framework import serializers

from apps.students.models import Student

from .models import Session


class SessionSerializer(serializers.ModelSerializer):
    student = serializers.PrimaryKeyRelatedField(queryset=Student.objects.all())

    class Meta:
        model = Session
        fields = ("id", "student", "mode", "started_at", "ended_at")
        read_only_fields = ("id", "started_at")

    def validate_student(self, student: Student) -> Student:
        user = self.context["request"].user
        if student.parent_id != user.id:
            raise serializers.ValidationError("Invalid student.")
        return student
