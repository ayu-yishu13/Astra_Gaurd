# Use a slim but stable version of Python
FROM python:3.9-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies for network capturing and building
RUN apt-get update && apt-get install -y \
    libpcap-dev \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user (Hugging Face requirement)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

# Copy requirements first to leverage Docker cache
COPY --chown=user requirements.txt .

# Install dependencies
# We use --no-cache-dir to keep the image small
RUN pip install --no-cache-dir --user -r requirements.txt

# Copy the rest of the application
COPY --chown=user . .

# Expose the HF default port
EXPOSE 7860

# Start the application
CMD ["python", "app.py"]