from rest_framework.permissions import BasePermission


class IsOwnerParent(BasePermission):
    """Only the owning Parent may access the resource."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        parent_id = getattr(obj, "parent_id", None)
        if parent_id is None and hasattr(obj, "student"):
            parent_id = obj.student.parent_id
        if parent_id is None and hasattr(obj, "session"):
            parent_id = obj.session.student.parent_id
        return parent_id == request.user.id
