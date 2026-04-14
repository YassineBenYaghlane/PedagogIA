from dj_rest_auth.registration.serializers import RegisterSerializer
from rest_framework import serializers

from apps.students.serializers import StudentNestedSerializer

from .models import Parent


class ParentSerializer(serializers.ModelSerializer):
    children = StudentNestedSerializer(many=True, read_only=True, source="students")

    class Meta:
        model = Parent
        fields = ("id", "email", "display_name", "children")
        read_only_fields = ("id", "email")


class ParentRegisterSerializer(RegisterSerializer):
    username = None
    display_name = serializers.CharField(required=False, allow_blank=True, max_length=100)

    def get_cleaned_data(self):
        data = super().get_cleaned_data()
        data["display_name"] = self.validated_data.get("display_name", "")
        return data

    def save(self, request):
        user = super().save(request)
        user.display_name = self.validated_data.get("display_name", "")
        user.save(update_fields=["display_name"])
        return user
