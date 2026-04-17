from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import StudentViewSet
from .views_parent import ParentOverviewView

router = DefaultRouter()
router.register(r"students", StudentViewSet, basename="student")

urlpatterns = [
    path("parent/overview/", ParentOverviewView.as_view(), name="parent-overview"),
    *router.urls,
]
