---
title: AI NIDS Backend
emoji: 🛡️
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# 🛡️ Adaptive AI Network Intrusion Detection System (NIDS)

This repository contains the backend API and machine learning logic for the AI-NIDS project. It is deployed as a Dockerized container on Hugging Face Spaces.

## 🚀 Key Features
- **Real-time Detection**: Flask-SocketIO with `eventlet` for high-concurrency traffic monitoring.
- **Dynamic ML Selection**: Automatically downloads and switches between `BCC` and `CICIDS` models from the Hugging Face Hub.
- **Cloud Guard**: Intelligent environment detection to disable raw socket sniffing when running in cloud environments (Hugging Face/Render).
- **Threat Analysis**: Integrated with Groq AI for deep packet inspection and human-readable threat summaries.

## 🛠️ Tech Stack
- **Framework**: Flask & Flask-SocketIO
- **Server**: Eventlet / Gunicorn
- **Machine Learning**: Scikit-learn, LightGBM, Joblib
- **Deployment**: Docker

## 🔒 Environment Variables (Required)
To run this Space, you must configure the following **Secrets** in your Space Settings:
- `GROQ_API_KEY`: API key for AI threat analysis.
- `MAIL_USERNAME`: Gmail address for sending security alerts.
- `MAIL_PASSWORD`: Google App Password (16-character code).
- `HF_TOKEN`: (Optional) Required only if your model repository is private.

## 📂 Project Structure
```text
.
├── app.py              # Main entry point (Port 7860)
├── Dockerfile          # Container configuration
├── requirements.txt    # Optimized dependencies
├── README.md           # This file (HF Config)
├── utils/              # Model selector and helpers
├── routes/             # API Blueprint definitions
└── capture/            # Packet processing logic