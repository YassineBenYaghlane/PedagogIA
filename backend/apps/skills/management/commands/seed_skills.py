from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.skills.models import Skill, SkillPrerequisite
from src.skill_tree.tree import load_skills, validate_dag


class Command(BaseCommand):
    help = "Seed the skill tree from skills.yaml — idempotent."

    def handle(self, *args, **options):
        skills = load_skills()
        errors = validate_dag(skills)
        if errors:
            for err in errors:
                self.stderr.write(self.style.ERROR(err))
            raise CommandError("Invalid skill DAG")

        with transaction.atomic():
            for s in skills:
                Skill.objects.update_or_create(
                    id=s["id"],
                    defaults={
                        "label": s["label"],
                        "grade": s["grade"],
                        "description": s.get("description", ""),
                        "mastery_threshold": s.get("mastery_threshold", 3),
                    },
                )

            SkillPrerequisite.objects.all().delete()
            links = []
            for s in skills:
                for prereq_id in s.get("prerequisites", []):
                    links.append(SkillPrerequisite(skill_id=s["id"], prerequisite_id=prereq_id))
            SkillPrerequisite.objects.bulk_create(links)

        self.stdout.write(self.style.SUCCESS(f"Seeded {len(skills)} skills"))
