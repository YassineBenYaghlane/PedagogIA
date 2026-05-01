from django.urls import path

from .atelier_views import audit, skill_detail, template_preview
from .diagnostic_views import next_question as diagnostic_next
from .diagnostic_views import result as diagnostic_result
from .diagnostic_views import start as diagnostic_start
from .drill_views import next_question as drill_next
from .drill_views import result as drill_result
from .drill_views import start as drill_start
from .exam_views import next_question as exam_next
from .exam_views import result as exam_result
from .exam_views import start as exam_start
from .views import generate, next_exercise, regenerate_signature, samples

urlpatterns = [
    path("exercises/generate/", generate, name="exercises-generate"),
    path("exercises/next/", next_exercise, name="exercises-next"),
    path("exercises/samples/", samples, name="exercises-samples"),
    path(
        "exercises/regenerate-signature/",
        regenerate_signature,
        name="exercises-regenerate-signature",
    ),
    path("exercises/audit/", audit, name="exercises-audit"),
    path("exercises/audit/skill/<str:skill_id>/", skill_detail, name="exercises-audit-skill"),
    path(
        "exercises/templates/<str:template_id>/preview/",
        template_preview,
        name="exercises-template-preview",
    ),
    path("diagnostic/start/", diagnostic_start, name="diagnostic-start"),
    path(
        "diagnostic/<uuid:session_id>/next/",
        diagnostic_next,
        name="diagnostic-next",
    ),
    path(
        "diagnostic/<uuid:session_id>/result/",
        diagnostic_result,
        name="diagnostic-result",
    ),
    path("drill/start/", drill_start, name="drill-start"),
    path("drill/<uuid:session_id>/next/", drill_next, name="drill-next"),
    path("drill/<uuid:session_id>/result/", drill_result, name="drill-result"),
    path("exam/start/", exam_start, name="exam-start"),
    path("exam/<uuid:session_id>/next/", exam_next, name="exam-next"),
    path("exam/<uuid:session_id>/result/", exam_result, name="exam-result"),
]
