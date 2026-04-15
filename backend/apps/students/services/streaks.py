from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from django.utils import timezone

from apps.exercises.models import Attempt
from apps.students.models import Student

BRUSSELS = ZoneInfo("Europe/Brussels")


def brussels_today() -> date:
    return timezone.now().astimezone(BRUSSELS).date()


def _brussels_day_range(day: date) -> tuple[datetime, datetime]:
    start_local = datetime.combine(day, time.min).replace(tzinfo=BRUSSELS)
    end_local = start_local + timedelta(days=1)
    return start_local, end_local


def update_streak(student: Student) -> None:
    today = brussels_today()
    last = student.last_activity_date
    if last is None or (today - last).days > 1:
        student.current_streak = 1
    elif (today - last).days == 1:
        student.current_streak += 1
    # delta == 0 → no change
    student.best_streak = max(student.best_streak, student.current_streak)
    student.last_activity_date = today
    student.save(update_fields=["current_streak", "best_streak", "last_activity_date"])


def daily_progress(student: Student) -> int:
    start, end = _brussels_day_range(brussels_today())
    return Attempt.objects.filter(
        session__student=student, responded_at__gte=start, responded_at__lt=end
    ).count()
