from rest_framework import serializers

from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    context_attempt_id = serializers.UUIDField(read_only=True, allow_null=True)
    context_skill_id = serializers.CharField(read_only=True, allow_null=True)

    class Meta:
        model = Message
        fields = (
            "id",
            "role",
            "content",
            "speech",
            "created_at",
            "model",
            "context_attempt_id",
            "context_skill_id",
        )
        read_only_fields = fields


class ConversationListSerializer(serializers.ModelSerializer):
    student_id = serializers.UUIDField(read_only=True)
    anchor_skill_id = serializers.CharField(read_only=True, allow_null=True)
    last_message_at = serializers.DateTimeField(source="updated_at", read_only=True)
    message_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Conversation
        fields = (
            "id",
            "student_id",
            "kind",
            "title",
            "anchor_skill_id",
            "created_at",
            "last_message_at",
            "message_count",
        )
        read_only_fields = fields


class ConversationSerializer(serializers.ModelSerializer):
    student_id = serializers.UUIDField(read_only=True)
    anchor_skill_id = serializers.CharField(read_only=True, allow_null=True)
    anchor_attempt_id = serializers.UUIDField(read_only=True, allow_null=True)
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = (
            "id",
            "student_id",
            "kind",
            "title",
            "anchor_skill_id",
            "anchor_attempt_id",
            "created_at",
            "updated_at",
            "messages",
        )
        read_only_fields = fields
