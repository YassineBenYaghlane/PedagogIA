"""Skill tree DAG: load, validate, and query the FWB skill tree."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

SKILLS_PATH = Path(__file__).parent / "skills.yaml"


def load_skills(path: Path = SKILLS_PATH) -> list[dict[str, Any]]:
    """Load skills from YAML file."""
    with open(path) as f:
        return yaml.safe_load(f)


def build_dag(skills: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    """Build a dict keyed by skill ID for fast lookup."""
    return {s["id"]: s for s in skills}


def validate_dag(skills: list[dict[str, Any]]) -> list[str]:
    """Validate the skill DAG. Returns a list of errors (empty = valid)."""
    errors = []
    dag = build_dag(skills)
    ids = set(dag.keys())

    # Check for duplicate IDs
    all_ids = [s["id"] for s in skills]
    if len(all_ids) != len(ids):
        dupes = [x for x in all_ids if all_ids.count(x) > 1]
        errors.append(f"Duplicate skill IDs: {set(dupes)}")

    # Check for orphan prerequisites
    for skill in skills:
        for prereq in skill.get("prerequisites", []):
            if prereq not in ids:
                errors.append(f"Skill '{skill['id']}' has unknown prerequisite '{prereq}'")

    # Check for self-loops
    for skill in skills:
        if skill["id"] in skill.get("prerequisites", []):
            errors.append(f"Skill '{skill['id']}' lists itself as prerequisite")

    # Check for cycles (DFS)
    WHITE, GRAY, BLACK = 0, 1, 2
    color = {s: WHITE for s in ids}

    def dfs(node: str) -> bool:
        color[node] = GRAY
        for prereq in dag[node].get("prerequisites", []):
            if prereq not in color:
                continue
            if color[prereq] == GRAY:
                errors.append(f"Cycle detected involving '{node}' and '{prereq}'")
                return True
            if color[prereq] == WHITE and dfs(prereq):
                return True
        color[node] = BLACK
        return False

    for node in ids:
        if color[node] == WHITE:
            dfs(node)

    return errors


def get_prerequisites(dag: dict[str, dict[str, Any]], skill_id: str) -> list[str]:
    """Get direct prerequisite IDs for a skill."""
    skill = dag.get(skill_id)
    if not skill:
        return []
    return skill.get("prerequisites", [])


def get_all_ancestors(dag: dict[str, dict[str, Any]], skill_id: str) -> set[str]:
    """Get all ancestors (transitive prerequisites) for a skill."""
    visited = set()
    stack = list(get_prerequisites(dag, skill_id))
    while stack:
        current = stack.pop()
        if current in visited:
            continue
        visited.add(current)
        stack.extend(get_prerequisites(dag, current))
    return visited


def get_skills_by_grade(skills: list[dict[str, Any]], grade: str) -> list[dict[str, Any]]:
    """Filter skills by grade (e.g., 'P1', 'P3')."""
    return [s for s in skills if s["grade"] == grade]


def get_frontier(
    dag: dict[str, dict[str, Any]],
    mastered: set[str],
) -> list[str]:
    """Get skills at the mastery frontier (all prereqs mastered, skill not yet)."""
    frontier = []
    for skill_id, skill in dag.items():
        if skill_id in mastered:
            continue
        prereqs = set(skill.get("prerequisites", []))
        if prereqs.issubset(mastered):
            frontier.append(skill_id)
    return frontier
