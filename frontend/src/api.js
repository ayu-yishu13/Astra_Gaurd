// ===============================================
// 🔐 API Layer for Adaptive AI NIDS Frontend
// ===============================================

const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

// Safe fetch wrapper with timeout and retry logic
async function safeFetch(url, options = {}, timeout = 10000, retries = 1) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const res = await fetch(url, { ...options, signal: controller.signal });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`HTTP ${res.status}: ${errText}`);
        }
        return await res.json();
    } catch (err) {
        console.error(`❌ API Error [${url}]:`, err.message);

        // Retry logic for specific sensitive endpoints
        if (retries > 0 && url.includes("/geo/")) {
            await new Promise((r) => setTimeout(r, 1500));
            return safeFetch(url, options, timeout * 1.5, retries - 1);
        }

        return { error: err.message };
    } finally {
        clearTimeout(id);
    }
}

// -------------------------------------------------------------
// 🖥️ SYSTEM & DIAGNOSTICS (NEWLY UPDATED)
// -------------------------------------------------------------
export async function getSystemStatus() {
    return safeFetch(`${BASE_URL}/api/system/status`);
}

export async function runSystemDiagnostic() {
    return safeFetch(`${BASE_URL}/api/system/diagnostic`);
}

export async function getSystemProcesses() {
    return safeFetch(`${BASE_URL}/api/system/processes`);
}

export async function getSystemConnections() {
    return safeFetch(`${BASE_URL}/api/system/connections`);
}

export function downloadSystemReport() {
    // Standard window.open for PDF downloads
    window.open(`${BASE_URL}/api/system/report`, "_blank");
}

// -------------------------------------------------------------
// 🚀 LIVE CAPTURE
// -------------------------------------------------------------
export async function startSniffer(iface = null) {
    const q = iface ? `?iface=${iface}` : "";
    return safeFetch(`${BASE_URL}/api/live/start${q}`);
}

export async function stopSniffer() {
    return safeFetch(`${BASE_URL}/api/live/stop`);
}

export async function getStatus() {
    return safeFetch(`${BASE_URL}/api/live/status`);
}

export async function getRecent(model, limit = 300) {
    const res = await safeFetch(`${BASE_URL}/api/live/recent?model=${model}`);
    if (res?.events && Array.isArray(res.events)) {
        res.events = res.events.slice(-limit);
    }
    return res;
}

export async function getStats(model) {
    return safeFetch(`${BASE_URL}/api/live/stats?model=${model}`);
}

// -------------------------------------------------------------
// 🧾 LOGS (MODEL-AWARE)
// -------------------------------------------------------------
export function download_logs(model) {
    window.location.href = `${BASE_URL}/api/logs/download?model=${model}`;
}

export async function clearLogs(model, n = 50) {
    return safeFetch(`${BASE_URL}/api/logs/clear?model=${model}&n=${n}`, { method: "POST" });
}

// -------------------------------------------------------------
// 🧩 MODEL CONTROL
// -------------------------------------------------------------
export async function getActiveModel() {
    return safeFetch(`${BASE_URL}/api/model/active?t=${Date.now()}`);
}

export async function switchModel(model) {
    return safeFetch(`${BASE_URL}/api/model/select`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model }),
    });
}

// -------------------------------------------------------------
// 🤖 AI HELPERS & CHAT
// -------------------------------------------------------------
export async function sendMessageToAI(message) {
    // Using the safeFetch logic for consistency
    return safeFetch(`${BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
    });
}

export async function offlinePredictAPI(file, model) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("model", model);

    const res = await fetch(`${BASE_URL}/api/offline/predict`, { 
        method: "POST",
        body: formData,
    });
    return res.json();
}

// -------------------------------------------------------------
// 🧾 LOGS (MODEL-AWARE)
// -------------------------------------------------------------

// ... keep your existing clearLogs function ...

export async function clearByPrediction(model, pred) {
  return safeFetch(
    `${BASE_URL}/api/logs/clear_pred?model=${model}&pred=${pred}`,
    { method: "POST" }
  );
}

export async function deleteOne(model, index) {
  return safeFetch(
    `${BASE_URL}/api/logs/delete_one?model=${model}&index=${index}`,
    { method: "POST" }
  );
}

export const downloadOfflineReport = () => {
    // FIX: Using BASE_URL for live deployment
    window.open(`${BASE_URL}/api/offline/report`, "_blank");
}

export { BASE_URL };

