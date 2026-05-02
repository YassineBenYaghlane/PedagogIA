from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.voice.models import VoiceUsage


class Command(BaseCommand):
    help = "Print this month's TTS char usage per student, ordered by usage."

    def add_arguments(self, parser):
        parser.add_argument(
            "--month",
            help="YYYY-MM (defaults to current month)",
            default=None,
        )

    def handle(self, *_args, **options):
        if options["month"]:
            year, month = (int(p) for p in options["month"].split("-"))
        else:
            now = timezone.now()
            year, month = now.year, now.month
        cap = settings.TTS_MONTHLY_CHAR_CAP_PER_STUDENT
        rows = (
            VoiceUsage.objects.filter(year=year, month=month)
            .select_related("student")
            .order_by("-chars_used")
        )
        self.stdout.write(f"{year}-{month:02d}  (cap: {cap:,} chars / student)\n")
        if not rows:
            self.stdout.write("  (no usage yet this month)")
            return
        total = 0
        for row in rows:
            total += row.chars_used
            pct = int(round(100 * row.chars_used / cap)) if cap else 0
            flag = " ← capped" if row.chars_used >= cap else ""
            self.stdout.write(
                f"  {row.student.display_name} ({row.student.grade}): "
                f"{row.chars_used:,} chars ({pct}%){flag}"
            )
        self.stdout.write(f"Total this month: {total:,} chars")
