from dj_rest_auth.registration.serializers import RegisterSerializer
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from apps.students.serializers import StudentNestedSerializer

from .models import User


class UserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        validators=[UniqueValidator(queryset=User.objects.all(), lookup="iexact")]
    )
    children = StudentNestedSerializer(many=True, read_only=True, source="students")

    class Meta:
        model = User
        fields = ("id", "email", "display_name", "children")
        read_only_fields = ("id",)


class UserRegisterSerializer(RegisterSerializer):
    username = None
    display_name = serializers.CharField(required=False, allow_blank=True, max_length=100)

    def validate_email(self, email):
        email = super().validate_email(email)
        # Belt-and-suspenders: allauth's pre-flight duplicate check looks at the
        # EmailAddress table first, but social-OAuth users can end up with an
        # unverified EmailAddress row that the check skips — leaving a duplicate
        # to surface as a 500 from the Postgres UNIQUE constraint. Catch it here.
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                "A user is already registered with this e-mail address."
            )
        return email

    def get_cleaned_data(self):
        data = super().get_cleaned_data()
        data["display_name"] = self.validated_data.get("display_name", "")
        return data

    def save(self, request):
        user = super().save(request)
        user.display_name = self.validated_data.get("display_name", "")
        user.save(update_fields=["display_name"])
        return user
