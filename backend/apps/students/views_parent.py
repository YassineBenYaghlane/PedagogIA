from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.sessions.exports import daily_activity_summary, session_summaries
from apps.students.services.streaks import daily_progress

from .models import Student
from .serializers import mastery_counts


def _student_payload(student: Student) -> dict:
    return {
        "id": str(student.id),
        "display_name": student.display_name,
        "grade": student.grade,
        "created_at": student.created_at.isoformat() if student.created_at else None,
        "gamification": {
            "xp": student.xp,
            "rank": student.rank,
            "current_streak": student.current_streak,
            "best_streak": student.best_streak,
            "last_activity_date": (
                student.last_activity_date.isoformat() if student.last_activity_date else None
            ),
            "daily_goal": student.daily_goal,
            "daily_progress": daily_progress(student),
        },
        "mastery_summary": mastery_counts(student),
        "recent_sessions": session_summaries(student)[:5],
        "last_7_days": daily_activity_summary(student, days=7),
    }


class ParentOverviewView(APIView):
    """Aggregated overview of every student on the authenticated account."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        students = Student.objects.filter(user=request.user).order_by("display_name")
        return Response({"students": [_student_payload(s) for s in students]})
