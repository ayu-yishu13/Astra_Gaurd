// ===============================================
// 🌐 SOCKET.IO CLIENT – Adaptive AI NIDS Frontend
// -----------------------------------------------
// ✅ Auto-reconnect with exponential backoff
// ✅ Safe single-instance export
// ✅ Unified event debugging
// ===============================================

import { io } from "socket.io-client";

// Detect backend URL automatically (for dev/prod)
const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://127.0.0.1:5000";

// ✅ Create socket connection with safe options
export const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  autoConnect: true,
});

// -----------------------------------------------
// 🧠 Debug + Diagnostics (shows in browser console)
// -----------------------------------------------
socket.on("connect", () => {
  console.log(`🟢 Socket.IO connected (${SOCKET_URL}) — id:`, socket.id);
});

socket.on("disconnect", (reason) => {
  console.warn(`🔴 Socket.IO disconnected: ${reason}`);
});

socket.on("connect_error", (err) => {
  console.error("⚠️ Socket.IO connection error:", err.message);
});

socket.on("reconnect_attempt", (attempt) => {
  console.log(`🔁 Reconnect attempt #${attempt}`);
});

socket.on("reconnect_failed", () => {
  console.error("❌ Socket.IO failed to reconnect after max attempts.");
});

socket.on("reconnect", (attempt) => {
  console.log(`✅ Successfully reconnected (attempt #${attempt})`);
});

// -----------------------------------------------
// ✅ Helper for dynamic event binding (optional)
// -----------------------------------------------
export function onSocketEvent(eventName, callback) {
  socket.off(eventName); // prevent duplicate listeners
  socket.on(eventName, callback);
}

// -----------------------------------------------
// 🚫 Graceful Cleanup (optional, for hot reloads)
// -----------------------------------------------
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    console.log("♻️  Cleaning up socket listeners...");
    socket.disconnect();
  });
}
