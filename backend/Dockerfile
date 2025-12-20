# 1. Use a standard Python image
FROM python:3.9-slim

# 2. Install system-level tools needed for Scapy and Network monitoring
RUN apt-get update && apt-get install -y \
    libpcap-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 3. Create a non-root user for security (Hugging Face requirement)
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:${PATH}"

# 4. Set the working directory
WORKDIR /home/user/app

# 5. Copy and install requirements
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# 6. Copy the rest of your code
COPY --chown=user . .

# 7. Hugging Face uses port 7860 by default
EXPOSE 7860

# 8. Start the server using Gunicorn + Eventlet (Best for SocketIO)
CMD ["gunicorn", "--worker-class", "eventlet", "-w", "1", "--bind", "0.0.0.0:7860", "app:app"]