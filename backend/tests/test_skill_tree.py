"""Tests for the skill tree DAG."""

from app.skill_tree.tree import (
    build_dag,
    get_all_ancestors,
    get_frontier,
    get_skills_by_grade,
    load_skills,
    validate_dag,
)


def test_load_skills():
    skills = load_skills()
    assert len(skills) > 50
    assert all("id" in s for s in skills)


def test_validate_dag_no_errors():
    skills = load_skills()
    errors = validate_dag(skills)
    assert errors == [], f"Validation errors: {errors}"


def test_single_root():
    skills = load_skills()
    roots = [s for s in skills if not s.get("prerequisites")]
    assert len(roots) == 1
    assert roots[0]["id"] == "num_compter_20"


def test_all_grades_present():
    skills = load_skills()
    grades = {s["grade"] for s in skills}
    assert grades == {"P1", "P2", "P3", "P4", "P5", "P6"}


def test_skills_per_grade_not_empty():
    skills = load_skills()
    for grade in ["P1", "P2", "P3", "P4", "P5", "P6"]:
        grade_skills = get_skills_by_grade(skills, grade)
        assert len(grade_skills) >= 5, f"{grade} has too few skills: {len(grade_skills)}"


def test_get_ancestors():
    skills = load_skills()
    dag = build_dag(skills)
    # add_avec_retenue_100 should have num_compter_20 as an ancestor
    ancestors = get_all_ancestors(dag, "add_avec_retenue_100")
    assert "num_compter_20" in ancestors
    assert "add_complements_10" in ancestors


def test_frontier_from_empty():
    skills = load_skills()
    dag = build_dag(skills)
    frontier = get_frontier(dag, mastered=set())
    assert frontier == ["num_compter_20"]


def test_frontier_after_p1_basics():
    skills = load_skills()
    dag = build_dag(skills)
    # After mastering counting and reading numbers
    mastered = {"num_compter_20", "num_lire_ecrire_20"}
    frontier = get_frontier(dag, mastered)
    # Should include next numeration + operation sense skills
    assert "num_dizaines_unites_20" in frontier
    assert "num_comparer_ordonner_20" in frontier
    assert "add_sens" in frontier
    assert "soustr_sens" in frontier


def test_no_p4_skill_without_p3_prereq():
    """P4 skills should not be reachable without mastering some P3 skills."""
    skills = load_skills()
    dag = build_dag(skills)
    p1_p2_ids = {s["id"] for s in skills if s["grade"] in ("P1", "P2")}
    frontier = get_frontier(dag, mastered=p1_p2_ids)
    # No P4 skill should be in frontier if only P1+P2 mastered
    p4_ids = {s["id"] for s in skills if s["grade"] == "P4"}
    assert not p4_ids.intersection(frontier), "P4 skills reachable without P3"
