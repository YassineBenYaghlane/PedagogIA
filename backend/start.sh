#!/usr/bin/env bash
set -e

uv run alembic upgrade head
uv run python -m src.skill_tree.seed
exec uv run uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
