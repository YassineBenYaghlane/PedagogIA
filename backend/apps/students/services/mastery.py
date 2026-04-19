from django.utils import timezone

from apps.exercises.models import ExerciseTemplate, TemplateSkillWeight
from apps.students.models import SKILL_XP_MAX, Student, StudentSkillState


def apply_template_attempt(
    student: Student, template: ExerciseTemplate, is_correct: bool
) -> list[StudentSkillState]:
    """Credit skill_xp to every skill linked to the template, weighted.

    Only called for drill / training modes. Diagnostic and exam don't mutate mastery.
    Wrong answers still bump total_attempts and last_practiced_at so stats stay honest.
    """
    now = timezone.now()
    links = list(TemplateSkillWeight.objects.filter(template=template).select_related("skill"))
    touched: list[StudentSkillState] = []
    for link in links:
        state, _ = StudentSkillState.objects.get_or_create(student=student, skill=link.skill)
        state.total_attempts += 1
        state.last_practiced_at = now
        if is_correct:
            state.skill_xp = min(SKILL_XP_MAX, state.skill_xp + link.weight)
        state.save()
        touched.append(state)
    return touched
