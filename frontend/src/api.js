// ===============================================
// 🔐 API Layer for Adaptive AI NIDS Frontend
// ===============================================

const BASE_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

// Safe fetch wrapper
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

// MODEL-AWARE 🎯
export async function getRecent(model, limit = 300) {
  const res = await safeFetch(`${BASE_URL}/api/live/recent?model=${model}`);

  if (res?.events && Array.isArray(res.events)) {
    res.events = res.events.slice(-limit);
  }
  return res;
}

// MODEL-AWARE 🎯
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
  return safeFetch(
    `${BASE_URL}/api/logs/clear?model=${model}&n=${n}`,
    { method: "POST" }
  );
}

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

// -------------------------------------------------------------
// 🌍 GEO + ALERTS
// -------------------------------------------------------------
export async function getGeoData() {
  return safeFetch(`${BASE_URL}/api/geo/recent`, {}, 20000, 2);
}

export async function getAlerts() {
  return safeFetch(`${BASE_URL}/api/alerts`);
}

// -------------------------------------------------------------
// 🧩 MODEL CONTROL
// -------------------------------------------------------------
export async function getActiveModel() {
  return safeFetch(`${BASE_URL}/api/model/active`);
}

export async function switchModel(model) {
  return safeFetch(`${BASE_URL}/api/model/select`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model }),
  });
}

export async function getModelHealth() {
  return safeFetch(`${BASE_URL}/api/model/health`);
}


// -------------------------------------------------------------
// 🤖 AI HELPERS
// -------------------------------------------------------------
export async function explainThreat(event) {
  return safeFetch(`${BASE_URL}/api/ai/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });
}

export async function getAISummary(model, n = 200) {
  return safeFetch(
    `${BASE_URL}/api/ai/summary?model=${encodeURIComponent(model)}&n=${n}`
  );
}


export async function sendMessageToAI(message) {
  try {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    if (!res.ok) throw new Error("Chat API failed");
    return res.json();
  } catch (err) {
    console.error("Chat error:", err);
    return { reply: "⚠ AI Assistant not responding." };
  }
}

// ➤ Offline CSV/PCAP prediction
export const offlinePredictAPI = async (file, model) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("model", model);

  const res = await fetch("http://127.0.0.1:5000/api/offline/predict", {
    method: "POST",
    body: formData,
  });

  return res.json();
};

// ➤ Get PDF forensic report download link
export const downloadOfflineReport = () => {
  window.open("http://127.0.0.1:5000/api/offline/report", "_blank");
};


// -------------------------------------------------------------
export { BASE_URL };


