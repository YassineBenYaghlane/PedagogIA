from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    """Only the owning User may access the resource."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user_id = getattr(obj, "user_id", None)
        if user_id is None and hasattr(obj, "student"):
            user_id = obj.student.user_id
        if user_id is None and hasattr(obj, "session"):
            user_id = obj.session.student.user_id
        return user_id == request.user.id
