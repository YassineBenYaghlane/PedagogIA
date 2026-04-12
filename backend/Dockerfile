FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

WORKDIR /app

COPY pyproject.toml uv.lock alembic.ini start.sh ./
COPY alembic ./alembic
COPY src ./src

RUN chmod +x start.sh

RUN uv sync

CMD ["./start.sh"]
