from __future__ import annotations

from collections import Counter

from sqlalchemy.orm import Session

from src.database import SessionLocal
from src.models.skill import ExerciseTemplate, Skill, SkillPrerequisite
from src.skill_tree.tree import build_dag, get_frontier, load_skills, load_templates, validate_dag


def seed_skills(db: Session) -> None:
    """Upsert all skills and prerequisites from YAML into the database."""
    skills = load_skills()

    errors = validate_dag(skills)
    if errors:
        print("VALIDATION ERRORS:")
        for err in errors:
            print(f"  ❌ {err}")
        raise SystemExit(1)

    for s in skills:
        existing = db.get(Skill, s["id"])
        if existing:
            existing.label = s["label"]
            existing.grade = s["grade"]
            existing.description = s["description"]
            existing.mastery_threshold = s.get("mastery_threshold", 3)
        else:
            db.add(
                Skill(
                    id=s["id"],
                    label=s["label"],
                    grade=s["grade"],
                    description=s["description"],
                    mastery_threshold=s.get("mastery_threshold", 3),
                )
            )

    db.flush()

    db.query(SkillPrerequisite).delete()
    for s in skills:
        for prereq_id in s.get("prerequisites", []):
            db.add(SkillPrerequisite(skill_id=s["id"], prerequisite_id=prereq_id))

    db.commit()
    print(f"✅ Seeded {len(skills)} skills into database")


def seed_templates(db: Session) -> None:
    """Upsert all exercise templates from YAML into the database."""
    templates = load_templates()

    for t in templates:
        existing = db.get(ExerciseTemplate, t["id"])
        if existing:
            existing.skill_id = t["skill_id"]
            existing.difficulty = t.get("difficulty", 1)
            existing.template = t["template"]
        else:
            db.add(
                ExerciseTemplate(
                    id=t["id"],
                    skill_id=t["skill_id"],
                    difficulty=t.get("difficulty", 1),
                    template=t["template"],
                )
            )

    db.commit()
    print(f"✅ Seeded {len(templates)} exercise templates into database")


def print_stats(skills: list[dict]) -> None:
    """Print skill tree statistics."""
    dag = build_dag(skills)
    grades = Counter(s["grade"] for s in skills)

    print(f"\n{'=' * 50}")
    print(f"PedagogIA Skill Tree — {len(skills)} skills")
    print(f"{'=' * 50}")

    for grade in sorted(grades.keys()):
        print(f"  {grade}: {grades[grade]} skills")

    total_edges = sum(len(s.get("prerequisites", [])) for s in skills)
    print(f"\n  Total prerequisite edges: {total_edges}")

    roots = [s["id"] for s in skills if not s.get("prerequisites")]
    print(f"  Root skills (no prereqs): {len(roots)}")
    for r in roots:
        print(f"    - {r}: {dag[r]['label']}")

    all_prereqs = set()
    for s in skills:
        all_prereqs.update(s.get("prerequisites", []))
    leaves = [s["id"] for s in skills if s["id"] not in all_prereqs]
    print(f"  Leaf skills (no dependents): {len(leaves)}")
    for leaf in leaves:
        print(f"    - {leaf}: {dag[leaf]['label']}")

    frontier = get_frontier(dag, mastered=set())
    print(f"\n  Starting frontier (P1 entry points): {len(frontier)}")
    for f in frontier:
        print(f"    - {f}: {dag[f]['label']}")

    templates = load_templates()
    skills_with_templates = len({t["skill_id"] for t in templates})
    print(f"\n  Exercise templates: {len(templates)} (covering {skills_with_templates} skills)")

    print()


def main() -> None:
    skills = load_skills()

    errors = validate_dag(skills)
    if errors:
        print("VALIDATION ERRORS:")
        for err in errors:
            print(f"  ❌ {err}")
        raise SystemExit(1)

    print("✅ Skill tree is valid (no cycles, no orphans, no duplicates)")

    db = SessionLocal()
    try:
        seed_skills(db)
        seed_templates(db)
    finally:
        db.close()

    print_stats(skills)


if __name__ == "__main__":
    main()
