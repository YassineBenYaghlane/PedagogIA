"""Seed the skill tree into the database.

For now (before issue #2), this validates the YAML and prints stats.
Once SQLAlchemy models exist, this will upsert into skills + skill_prerequisites tables.
"""

from __future__ import annotations

from collections import Counter

from app.skill_tree.tree import load_skills, build_dag, validate_dag, get_frontier


def print_stats(skills: list[dict]) -> None:
    """Print skill tree statistics."""
    dag = build_dag(skills)
    grades = Counter(s["grade"] for s in skills)

    print(f"\n{'=' * 50}")
    print(f"PedagogIA Skill Tree — {len(skills)} skills")
    print(f"{'=' * 50}")

    for grade in sorted(grades.keys()):
        print(f"  {grade}: {grades[grade]} skills")

    # Count edges
    total_edges = sum(len(s.get("prerequisites", [])) for s in skills)
    print(f"\n  Total prerequisite edges: {total_edges}")

    # Root skills (no prerequisites)
    roots = [s["id"] for s in skills if not s.get("prerequisites")]
    print(f"  Root skills (no prereqs): {len(roots)}")
    for r in roots:
        print(f"    - {r}: {dag[r]['label']}")

    # Leaf skills (nothing depends on them)
    all_prereqs = set()
    for s in skills:
        all_prereqs.update(s.get("prerequisites", []))
    leaves = [s["id"] for s in skills if s["id"] not in all_prereqs]
    print(f"  Leaf skills (no dependents): {len(leaves)}")
    for leaf in leaves:
        print(f"    - {leaf}: {dag[leaf]['label']}")

    # Frontier from empty mastery (starting skills)
    frontier = get_frontier(dag, mastered=set())
    print(f"\n  Starting frontier (P1 entry points): {len(frontier)}")
    for f in frontier:
        print(f"    - {f}: {dag[f]['label']}")

    print()


def main() -> None:
    skills = load_skills()

    # Validate
    errors = validate_dag(skills)
    if errors:
        print("VALIDATION ERRORS:")
        for err in errors:
            print(f"  ❌ {err}")
        raise SystemExit(1)

    print("✅ Skill tree is valid (no cycles, no orphans, no duplicates)")
    print_stats(skills)


if __name__ == "__main__":
    main()
