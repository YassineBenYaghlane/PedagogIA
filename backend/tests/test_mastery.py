import pytest

from apps.exercises.models import ExerciseTemplate, TemplateSkillWeight
from apps.skills.models import Skill
from apps.students.models import SKILL_XP_MAX, Student, StudentSkillState
from apps.students.serializers import mastery_counts
from apps.students.services.grade_seeding import seed_prior_grade_mastery
from apps.students.services.mastery import apply_template_attempt


@pytest.fixture
def student(user):
    return Student.objects.create(user=user, display_name="A", grade="P2")


@pytest.fixture
def skill(db):
    return Skill.objects.get(id="add_avec_retenue_20")


@pytest.fixture
def single_skill_template(db, skill):
    template = ExerciseTemplate.objects.filter(skills=skill).first()
    assert template is not None
    return template


@pytest.mark.django_db
def test_correct_attempt_bumps_skill_xp_by_weight(student, skill, single_skill_template):
    weight = TemplateSkillWeight.objects.get(template=single_skill_template, skill=skill).weight
    apply_template_attempt(student, single_skill_template, True)
    state = StudentSkillState.objects.get(student=student, skill=skill)
    assert state.skill_xp == pytest.approx(weight)
    assert state.total_attempts == 1
    assert state.last_practiced_at is not None


@pytest.mark.django_db
def test_wrong_attempt_does_not_bump_skill_xp(student, skill, single_skill_template):
    apply_template_attempt(student, single_skill_template, False)
    state = StudentSkillState.objects.get(student=student, skill=skill)
    assert state.skill_xp == 0.0
    assert state.total_attempts == 1


@pytest.mark.django_db
def test_skill_xp_caps_at_max(student, skill, single_skill_template):
    state, _ = StudentSkillState.objects.get_or_create(student=student, skill=skill)
    state.skill_xp = SKILL_XP_MAX - 0.1
    state.save()
    apply_template_attempt(student, single_skill_template, True)
    state.refresh_from_db()
    assert state.skill_xp == pytest.approx(SKILL_XP_MAX)


@pytest.mark.django_db
def test_multi_skill_weights_credit_all_linked_skills(student, skill):
    template = ExerciseTemplate.objects.create(
        id="__test_multi",
        difficulty=1,
        input_type="number",
        template={"type": "fill_blank", "params": {}, "prompt_template": "x"},
    )
    other = Skill.objects.filter(grade="P2").exclude(id=skill.id).first()
    assert other is not None
    TemplateSkillWeight.objects.create(template=template, skill=skill, weight=1.0)
    TemplateSkillWeight.objects.create(template=template, skill=other, weight=0.5)

    apply_template_attempt(student, template, True)

    s1 = StudentSkillState.objects.get(student=student, skill=skill)
    s2 = StudentSkillState.objects.get(student=student, skill=other)
    assert s1.skill_xp == pytest.approx(1.0)
    assert s2.skill_xp == pytest.approx(0.5)


@pytest.mark.django_db
def test_creates_state_if_missing(student, skill, single_skill_template):
    assert not StudentSkillState.objects.filter(student=student, skill=skill).exists()
    apply_template_attempt(student, single_skill_template, True)
    assert StudentSkillState.objects.filter(student=student, skill=skill).exists()


@pytest.mark.django_db
def test_mastery_counts_covers_full_catalog_for_p1_student(user):
    """A P1 student with no attempts: every catalog skill sits in `not_started`."""
    s = Student.objects.create(user=user, display_name="Z", grade="P1")
    total = Skill.objects.count()
    counts = mastery_counts(s)
    assert counts["not_started"] == total
    assert counts["mastered"] == 0
    assert counts["in_progress"] == 0


@pytest.mark.django_db
def test_mastery_counts_higher_grade_student_sees_full_catalog(user):
    """P3 student: prior-grade auto-mastery → Acquis, the rest sits in À découvrir."""
    s = Student.objects.create(user=user, display_name="Z", grade="P3")
    seed_prior_grade_mastery(s)
    total = Skill.objects.count()
    lower = Skill.objects.filter(grade__lt="P3").count()
    counts = mastery_counts(s)
    assert counts["mastered"] == lower
    assert counts["not_started"] == total - lower


@pytest.mark.django_db
def test_mastery_counts_attempted_skill_moves_out_of_not_started(
    student, skill, single_skill_template
):
    before = mastery_counts(student)["not_started"]
    apply_template_attempt(student, single_skill_template, True)
    after = mastery_counts(student)
    assert after["not_started"] == before - 1
    assert after["in_progress"] == 1


@pytest.mark.django_db
def test_status_property_reflects_skill_xp(student, skill):
    state = StudentSkillState.objects.create(student=student, skill=skill, skill_xp=0.0)
    assert state.status == StudentSkillState.NOT_STARTED
    state.skill_xp = 5.0
    assert state.status == StudentSkillState.LEARNING_EASY
    state.skill_xp = 15.0
    assert state.status == StudentSkillState.LEARNING_MEDIUM
    state.skill_xp = 25.0
    assert state.status == StudentSkillState.LEARNING_HARD
    state.skill_xp = SKILL_XP_MAX
    assert state.status == StudentSkillState.MASTERED
