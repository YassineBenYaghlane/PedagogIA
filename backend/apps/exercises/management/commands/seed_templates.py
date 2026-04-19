from django.core.management.base import BaseCommand
from django.db import transaction

from apps.exercises.models import ExerciseTemplate, TemplateSkillWeight
from src.skill_tree.tree import load_templates


def _skill_links(t: dict) -> list[tuple[str, float]]:
    """Extract (skill_id, weight) pairs from a template YAML entry."""
    raw = t.get("skills")
    if isinstance(raw, list) and raw:
        out = []
        for entry in raw:
            if isinstance(entry, dict):
                sid = entry.get("id") or entry.get("skill_id")
                weight = float(entry.get("weight", 1.0))
            else:
                sid = entry
                weight = 1.0
            if sid:
                out.append((sid, weight))
        if out:
            return out
    sid = t.get("skill_id")
    if sid:
        return [(sid, 1.0)]
    return []


class Command(BaseCommand):
    help = "Seed exercise templates from all exercise_templates_p*.yaml files."

    def handle(self, *args, **options):
        templates = load_templates()
        with transaction.atomic():
            for t in templates:
                template, _ = ExerciseTemplate.objects.update_or_create(
                    id=t["id"],
                    defaults={
                        "difficulty": t.get("difficulty", 1),
                        "input_type": t.get("input_type", "number"),
                        "template": t["template"],
                    },
                )
                links = _skill_links(t)
                seen_skill_ids = set()
                for skill_id, weight in links:
                    seen_skill_ids.add(skill_id)
                    TemplateSkillWeight.objects.update_or_create(
                        template=template,
                        skill_id=skill_id,
                        defaults={"weight": weight},
                    )
                TemplateSkillWeight.objects.filter(template=template).exclude(
                    skill_id__in=seen_skill_ids
                ).delete()
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(templates)} templates"))
