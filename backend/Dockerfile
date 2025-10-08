FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements (without uvloop for compatibility)
COPY requirements.txt .

# Remove uvloop and httptools for cross-platform compatibility
RUN grep -v "uvloop\|httptools" requirements.txt > requirements-docker.txt && \
    pip install --no-cache-dir -r requirements-docker.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]