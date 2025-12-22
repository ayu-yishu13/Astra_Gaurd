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

This repository contains the backend API for the AI-NIDS project, deployed as a Dockerized container.

## 🚀 Deployment Features
- **Real-time Monitoring**: Flask-SocketIO with `eventlet`.
- **Cloud-Ready**: Automatic sniffer bypass for Hugging Face environments.
- **AI Integration**: Threat analysis via Groq Llma.

## 🔒 Required Secrets
Add these in **Settings > Variables and Secrets**:
- `GROQ_API_KEY`
- `MAIL_USERNAME`
- `MAIL_PASSWORD`