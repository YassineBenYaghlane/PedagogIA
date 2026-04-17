from django.core.management.base import BaseCommand
from django.db import transaction

from apps.exercises.models import ExerciseTemplate
from src.skill_tree.tree import load_templates


class Command(BaseCommand):
    help = "Seed exercise templates from all exercise_templates_p*.yaml files."

    def handle(self, *args, **options):
        templates = load_templates()
        with transaction.atomic():
            for t in templates:
                ExerciseTemplate.objects.update_or_create(
                    id=t["id"],
                    defaults={
                        "skill_id": t["skill_id"],
                        "difficulty": t.get("difficulty", 1),
                        "input_type": t.get("input_type", "number"),
                        "template": t["template"],
                    },
                )
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(templates)} templates"))
