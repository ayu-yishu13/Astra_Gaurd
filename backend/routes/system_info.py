from flask import Blueprint, jsonify
import psutil
import platform
import socket
from datetime import datetime
import random
import time
import random
import io
from fpdf import FPDF
from flask import send_file




system_bp = Blueprint("system", __name__)

@system_bp.route("/system/status", methods=["GET"])
def system_status():
    try:
        hostname = socket.gethostname()
        ip_address = socket.gethostbyname(hostname)
        os_info = platform.platform()
        cpu_name = platform.processor()

        # --- Metrics ---
        cpu_percent = psutil.cpu_percent(interval=0.5)
        ram = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        net_io = psutil.net_io_counters()

        # --- Temperature ---
        try:
            temps = psutil.sensors_temperatures()
            cpu_temp = (
                temps.get("coretemp")[0].current
                if "coretemp" in temps
                else random.uniform(45.0, 75.0)  # fallback
            )
        except Exception:
            cpu_temp = random.uniform(45.0, 75.0)

        # --- AI Health Score ---
        # Weighted average (higher = better)
        usage = (cpu_percent * 0.4 + ram.percent * 0.3 + disk.percent * 0.3)
        health_score = max(0, 100 - usage)

        data = {
            "hostname": hostname,
            "ip_address": ip_address,
            "os": os_info,
            "cpu_name": cpu_name,
            "cpu_usage": round(cpu_percent, 2),
            "ram_usage": round(ram.percent, 2),
            "disk_usage": round(disk.percent, 2),
            "ram_total": round(ram.total / (1024 ** 3), 2),
            "disk_total": round(disk.total / (1024 ** 3), 2),
            "network_sent": round(net_io.bytes_sent / (1024 ** 2), 2),
            "network_recv": round(net_io.bytes_recv / (1024 ** 2), 2),
            "cpu_temp": round(cpu_temp, 2),
            "health_score": round(health_score, 2),
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        }
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@system_bp.route("/system/diagnostic", methods=["GET"])
def run_diagnostic():
    """Simulate a full AI-powered system stability diagnostic."""
    try:
        # Simulated stress test (CPU, memory response)
        cpu_load = random.uniform(60, 98)
        ram_stress = random.uniform(50, 95)
        disk_io = random.uniform(40, 90)
        latency = random.uniform(15, 100)

        # AI stability score (100 = perfect)
        stability = 100 - ((cpu_load * 0.3) + (ram_stress * 0.3) + (disk_io * 0.2) + (latency * 0.2)) / 2
        stability = round(max(0, min(100, stability)), 2)

        # Fake attack summary data
        attacks = {
            "total_attacks": random.randint(1200, 4200),
            "blocked": random.randint(1100, 4000),
            "missed": random.randint(5, 20),
            "recent_threats": [
                {"type": "DDoS Flood", "risk": "High", "ip": "45.77.23.9"},
                {"type": "SQL Injection", "risk": "Medium", "ip": "103.54.66.120"},
                {"type": "VPN Evasion", "risk": "Low", "ip": "198.168.12.45"},
            ],
        }

        diagnostic = {
            "cpu_load": round(cpu_load, 2),
            "ram_stress": round(ram_stress, 2),
            "disk_io": round(disk_io, 2),
            "latency": round(latency, 2),
            "stability_score": stability,
            "attacks": attacks,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        }
        return jsonify(diagnostic)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    
    
@system_bp.route("/system/report", methods=["GET"])
def generate_system_report():
    """Generate a downloadable PDF system report."""
    try:
        # --- Simulated data or pull from live sources ---
        system_status = {
            "OS": "Windows 10 Pro",
            "CPU": "Intel i5-12700H",
            "Memory": "16 GB",
            "Disk": "512 GB SSD",
            "IP": "127.0.0.1",
            "Health Score": "89%",
            "Last Diagnostic": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        }

        # --- Create PDF report ---
        pdf = FPDF()
        pdf.add_page()
        pdf.set_auto_page_break(auto=True, margin=15)

        # Title
        pdf.set_font("Helvetica", "B", 18)
        pdf.cell(0, 10, "Adaptive AI NIDS - System Report", ln=True, align="C")
        pdf.ln(10)

        # Subtitle
        pdf.set_font("Helvetica", "", 12)
        pdf.cell(0, 10, f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", ln=True)
        pdf.ln(8)

        # Section: System Status
        pdf.set_font("Helvetica", "B", 14)
        pdf.cell(0, 10, "System Information", ln=True)
        pdf.set_font("Helvetica", "", 12)
        pdf.ln(5)

        for key, value in system_status.items():
            pdf.cell(0, 8, f"{key}: {value}", ln=True)

        pdf.ln(10)
        pdf.set_font("Helvetica", "B", 14)
        pdf.cell(0, 10, "Attack Summary (Last 24h)", ln=True)
        pdf.set_font("Helvetica", "", 12)
        pdf.ln(5)

        pdf.cell(0, 8, "Total Attacks Detected: 3471", ln=True)
        pdf.cell(0, 8, "High Risk: 512", ln=True)
        pdf.cell(0, 8, "Medium Risk: 948", ln=True)
        pdf.cell(0, 8, "Low Risk: 2011", ln=True)

        pdf.ln(10)
        pdf.set_font("Helvetica", "I", 10)
        pdf.cell(0, 8, "This report is automatically generated by Adaptive AI NIDS.", ln=True, align="C")

        # Save to memory
        buffer = io.BytesIO()
        pdf.output(buffer)
        buffer.seek(0)

        filename = f"System_Report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        return send_file(buffer, as_attachment=True, download_name=filename, mimetype="application/pdf")

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@system_bp.route("/system/processes")
def system_processes():
    try:
        processes = []
        for proc in psutil.process_iter(['name', 'cpu_percent', 'memory_percent', 'status']):
            info = proc.info
            processes.append({
                "name": info.get("name", "Unknown"),
                "cpu": round(info.get("cpu_percent", 0), 2),
                "mem": round(info.get("memory_percent", 0), 2),
                "status": info.get("status", "N/A"),
            })
        # ✅ Sort by CPU usage and keep top 6
        top_processes = sorted(processes, key=lambda p: p["cpu"], reverse=True)[:6]
        return jsonify(top_processes)
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@system_bp.route("/system/connections")
def system_connections():
    try:
        conns = []
        for c in psutil.net_connections(kind='inet'):
            if c.laddr:
                conns.append({
                    "ip": c.laddr.ip,
                    "port": c.laddr.port,
                    "proto": "TCP" if c.type == socket.SOCK_STREAM else "UDP",
                    "state": c.status,
                })
        # ✅ Only top 6 most recent/active connections
        top_conns = conns[:6]
        return jsonify(top_conns)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
