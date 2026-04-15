FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libpango-1.0-0 \
        libpangoft2-1.0-0 \
        fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml uv.lock start.sh ./
COPY pedagogia ./pedagogia
COPY apps ./apps
COPY src ./src
COPY templates ./templates
COPY manage.py ./

RUN chmod +x start.sh
RUN uv sync

CMD ["./start.sh"]
