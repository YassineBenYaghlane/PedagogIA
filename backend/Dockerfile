FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

WORKDIR /app

COPY pyproject.toml uv.lock start.sh ./
COPY pedagogia ./pedagogia
COPY apps ./apps
COPY src ./src
COPY manage.py ./

RUN chmod +x start.sh
RUN uv sync

CMD ["./start.sh"]
