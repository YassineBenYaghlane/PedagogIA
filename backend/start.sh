#!/usr/bin/env bash
set -e

uv run python manage.py migrate --noinput
uv run python manage.py collectstatic --noinput
uv run python manage.py seed_skills
uv run python manage.py seed_templates

if [ "${DJANGO_DEV_SERVER:-0}" = "1" ]; then
  exec uv run python manage.py runserver 0.0.0.0:8000
else
  exec uv run gunicorn pedagogia.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 2 \
    --reload
fi
