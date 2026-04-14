#!/usr/bin/env bash
set -e

uv run python manage.py migrate --noinput
uv run python manage.py seed_skills
uv run python manage.py seed_templates
exec uv run python manage.py runserver 0.0.0.0:8000
