# ---------------------------------------------------------------------------
# Backend Dockerfile - Financial Time Machine API
# ---------------------------------------------------------------------------
FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered stdout
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Install system build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    gcc \
    && rm -rf /var/lib/apt-get/lists/*

# Copy dependency requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Expose backend API port
EXPOSE 8001

# Run database auto-creation / seeding and launch FastAPI server via Uvicorn
CMD ["sh", "-c", "python scripts/seed_demo_users.py && uvicorn main:app --host 0.0.0.0 --port 8001"]
