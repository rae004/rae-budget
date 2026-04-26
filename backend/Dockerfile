# syntax=docker/dockerfile:1

FROM python:3.13-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Put the venv outside /app so the dev bind-mount (./backend:/app) can never shadow or corrupt it
ENV UV_PROJECT_ENVIRONMENT=/opt/venv

# Copy dependency files first for caching
COPY pyproject.toml .python-version ./

# Install dependencies into /opt/venv
RUN uv sync --no-install-project --no-dev

# Copy application code
COPY . .

# Set environment variables
ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV FLASK_APP=app:create_app

EXPOSE 5000

CMD ["flask", "run", "--host=0.0.0.0", "--port=5000"]
