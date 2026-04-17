FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PATH="/app/.venv/bin:$PATH"

COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev

COPY backend/ ./

RUN groupadd --system --gid 1000 app \
 && useradd --system --uid 1000 --gid app --home-dir /app --shell /usr/sbin/nologin app \
 && chmod +x start.sh \
 && mkdir -p staticfiles \
 && chown -R app:app /app

USER app
EXPOSE 8000
CMD ["./start.sh"]
