# 🛡️ ASTRAGUARD: Hybrid AI-Powered NIDS
**Advanced Network Intrusion Detection System with Cloud-Edge Intelligence**

<div align="center">

[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME)
[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://your-project.vercel.app)
[![Hugging Face](https://img.shields.io/badge/%F0%9F%A4%97%20Hugging%20Face-Models-yellow?style=for-the-badge)](https://huggingface.co/YOUR_USERNAME/YOUR_MODEL_NAME)
[![Firebase](https://img.shields.io/badge/Backend-Firebase-FFCA28?style=for-the-badge&logo=firebase)](https://console.firebase.google.com/)
[![Docker](https://img.shields.io/badge/Container-Docker-2496ED?style=for-the-badge&logo=docker)](https://hub.docker.com/)

</div>
🚀 Infrastructure & DevOps (The "Brag" Section)
Add this section right after your Architecture section. It explains why your choice of tech makes the project superior.

Markdown

## 🏗️ DevOps & Cloud Infrastructure

ASTRAGUARD is engineered for high availability and seamless scalability using industry-standard DevOps tools.

### 🔥 Real-Time Intelligence with Firebase
We utilized **Firebase** as the backbone for real-time data persistence and synchronization.
* **Instant Sync:** Threat alerts and packet summaries are pushed from the backend to the dashboard in milliseconds via Firebase Realtime Database/Firestore.
* **Secure Auth:** Integrated Firebase Authentication ensures that sensitive network logs are only accessible to authorized security personnel.
* **Scalable Hosting:** Leveraging Firebase's global CDN for low-latency delivery of core assets.

### 🐳 Containerization via Docker
The entire ASTRAGUARD backend is **Dockerized**, ensuring a "Write Once, Run Anywhere" deployment flow.
* **Environment Isolation:** Docker eliminates the "it works on my machine" problem by bundling the Python environment, ML libraries (Scikit-Learn, Pandas), and FastAPI logic into a single immutable image.
* **Microservices Ready:** The architecture is decoupled; the backend and frontend can scale independently.
* **Deployment Speed:** Integrated with GitHub Actions for CI/CD, allowing instant deployment to Hugging Face Spaces or AWS ECS.



---
## 📺 Multimedia Showcase

### 🎥 Video Demonstration
[![ASTRAGUARD Demo Video](https://img.shields.io/badge/YouTube-Video_Demo-red?style=for-the-badge&logo=youtube)](YOUR_YOUTUBE_LINK_HERE)
*Click the badge above to watch the full system walkthrough, including real-time packet sniffing and AI threat interpretation.*

### 🖼️ System Gallery
<div align="center">
  <table border="0">
    <tr>
      <td><img src="./screenshots/dashboard_main.png" width="400" alt="Main Dashboard"/><br/><sub><b>Real-Time Monitoring Console</b></sub></td>
      <td><img src="./screenshots/ai_assistant.png" width="400" alt="AI Assistant"/><br/><sub><b>NIDS_CORE_AI Integration</b></sub></td>
    </tr>
    <tr>
      <td><img src="./screenshots/threat_detected.png" width="400" alt="Threat Alert"/><br/><sub><b>Classification Result (DDoS/Probe)</b></sub></td>
      <td><img src="./screenshots/mobile_view.png" width="400" alt="Mobile UI"/><br/><sub><b>Fully Responsive Floating Mobile UI</b></sub></td>
    </tr>
  </table>
</div>

---

## 📜 Academic Publication & Recognition

This project is backed by peer-reviewed research and was presented at a premier IEEE conference.

### 📝 IEEE Research Paper
**Title:** "A Hybrid Edge-Cloud Architecture for Real-Time Intrusion Detection using Machine Learning and LLM-based Interpretability"  
**Conference:** **ICMNWC 2025** (International Conference on Mobile Networks and Wireless Communications)  
**Status:** **Accepted & Presented** > [!IMPORTANT]
> This project was awarded the **** at the conference, recognizing its contribution to efficient, cloud-integrated network security.



---

---

ASTRAGUARD is a sophisticated security ecosystem that bridges the gap between local network monitoring and cloud-based Machine Learning. By utilizing a **Local Sniffing Agent** to bypass browser sandboxing and a **Hugging Face-hosted ML Pipeline** for threat classification, ASTRAGUARD identifies, visualizes, and explains network attacks in real-time.

---


---

## 🌐 Project Resources

| Resource | Link | Description |
| :--- | :--- | :--- |
| **Frontend UI** | [astraguard-web.vercel.app](https://astra-gaurd-recs.vercel.app/) | Live React dashboard with NIDS_CORE_AI. |
| **Source Code** | [github.com/user/repo](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME) | Complete source for Frontend, Backend, and Agent. |
| **Backend Inference API** | [Hugging Face Endpoint](https://huggingface.co/spaces/CodebaseAi/ai-nids-backend) | Hosted Random Forest Classifier for packet analysis. |
| **Model Repository** | [HF Model Files](https://huggingface.co/CodebaseAi/netraids-ml-models) | Access to `model.pkl`, `scaler.pkl`, and training logs. |
| **Docker Hub** | [Container Image](https://huggingface.co/CodebaseAi/netraids-ml-models) | Pre-configured FastAPI environment. |

---
## 🏗️ System Architecture

ASTRAGUARD operates across three distinct tiers to ensure both privacy and high-performance intelligence:

1.  **Edge Layer (Local Agent):** A Python-based sniffer using `Scapy` that captures raw packets, extracts behavioral features, and pipes metadata to the backend.
2.  **Processing Layer (FastAPI + Docker):** A containerized gateway that orchestrates data flow, manages user sessions, and communicates with AI endpoints.
3.  **Intelligence Layer (Hugging Face):** * **Traffic Classifier:** Custom-trained ML models (Random Forest/XGBoost) for intrusion detection.
    * **NIDS_CORE_AI:** A Llama-3.1-8B-Instant LLM that interprets technical logs into human-readable security briefings.



---

## 🔬 Machine Learning & Data Science

### 📊 Dataset & Training
* **Source:** Trained on a hybrid of **NSL-KDD** and **CIC-IDS-2017** datasets.
* **Accuracy:** **98.2%** on test validation.
* **F1-Score:** 0.97, optimized to minimize False Negatives in high-risk attack classes.

### 🛠️ The Pipeline
To ensure inference consistency, the system uses a strictly version-controlled pipeline hosted on Hugging Face:
* **Feature Selection:** 41-78 features per flow (Duration, Protocol, Flag, Src_Bytes, etc.).
* **Scaling:** A **StandardScaler** normalized to the training distribution.
* **Encoding:** One-Hot Encoding for categorical categorical protocols (TCP/UDP/ICMP).



---

## 🚀 Deployment Guide (A-Z)

### 1. Backend Configuration (Docker)
The backend handles the uplink to your Hugging Face models.

**`.env` file requirements:**
```env
HF_TOKEN=your_huggingface_api_token
MODEL_ENDPOINT=[https://api-inference.huggingface.co/models/your-handle/astraguard-classifier](https://api-inference.huggingface.co/models/your-handle/astraguard-classifier)
LLAMA_ENDPOINT=[https://api-inference.huggingface.co/models/meta-llama/Llama-3.1-8B-Instant](https://api-inference.huggingface.co/models/meta-llama/Llama-3.1-8B-Instant)
Docker Command:

docker build -t astraguard-backend .
docker run -d -p 8000:8000 --env-file .env astraguard-backend

```
### 2. Frontend Deployment
The dashboard is built with React (Vite) and Tailwind CSS, optimized for both Desktop and Mobile.

Vercel/Netlify: Simply connect your GitHub repo.

Manual: npm install && npm run build

### 3. The Local Agent (Essential)
   * Why? Browsers cannot access raw sockets. To see "Live Traffic," you must run the agent locally.
   * Download AstraAgent.py from the dashboard.
   * Install dependencies: pip install scapy requests

Run with root privileges:

* sudo python3 AstraAgent.py --server [http://your-api-url.com](http://your-api-url.com)

## 🛑 Security Restrictions & Philosophy
 * Privacy First: ASTRAGUARD only sends packet headers/metadata to the cloud. The payload (your actual data) never leaves your local machine.
 * Feature Guarding: UI routes like /livetraffic are protected by a FeatureGuard that checks for an active Local Agent connection.

## 🔮 Future Scope
   * [ ] IPS Integration: Automating firewall rules (iptables/nftables) to block detected attackers.
   * [ ] PCAP Analysis: Uploading historical Wireshark files for batch AI analysis.
  * [ ] Distributed Nodes: Managing multiple local agents across different geographic locations from one UI.

🛠️ Project Files
requirements.txt
```
fastapi==0.104.1
uvicorn==0.24.0
scapy==2.5.0
requests==2.31.0
scikit-learn==1.3.2
pandas==2.1.3
python-dotenv==1.0.0
docker-compose.yaml
```

YAML
```
version: '3.8'
services:
  backend:
    image: your-username/astraguard-backend
    ports: ["8000:8000"]
    env_file: .env
  frontend:
    image: your-username/astraguard-frontend
    ports: ["3000:3000"]
```
Lead Developer: [Your Name] Deployment: [Link to Vercel] | [Link to Docker Hub] | [Link to Hugging Face Repo]

Disclaimer: This tool is for authorized security auditing only.
