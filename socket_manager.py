# socket_manager.py (Optimized)
# - Non-blocking emit queue with background worker
# - Rate-limited batching for frequent events
# - Backwards-compatible init_socketio & emit_new_event API

import threading
import time
import queue

_emit_q = queue.Queue(maxsize=2000)
_socketio = None
_emit_lock = threading.Lock()
_worker_thr = None
_stop_worker = threading.Event()

# batch/rate config
_BATCH_INTERVAL = 0.5  # seconds between worker sends
_BATCH_MAX = 10        # max events to bundle per emit


def init_socketio(socketio):
    """Initialize global socketio and start background emit worker."""
    global _socketio, _worker_thr
    _socketio = socketio
    print("✅ SocketIO initialized (thread-safe)")
    if _worker_thr is None or not _worker_thr.is_alive():
        _worker_thr = threading.Thread(target=_emit_worker, daemon=True)
        _worker_thr.start()


def _emit_worker():
    """Background worker: drains _emit_q and emits aggregated payloads at intervals."""
    last_send = 0.0
    buffer = []
    while not _stop_worker.is_set():
        try:
            evt = _emit_q.get(timeout=_BATCH_INTERVAL)
            buffer.append(evt)
        except Exception:
            # timeout, flush if buffer exists
            pass

        now = time.time()
        if buffer and (now - last_send >= _BATCH_INTERVAL or len(buffer) >= _BATCH_MAX):
            payload = {"count": len(buffer), "items": buffer[:_BATCH_MAX]}
            try:
                if _socketio:
                    # emit in background so worker isn't blocked on network
                    _socketio.start_background_task(lambda: _socketio.emit("new_event", payload, namespace="/"))
            except Exception as e:
                print("⚠️ emit worker error:", e)
            buffer.clear()
            last_send = now

    # final flush on shutdown
    if buffer and _socketio:
        try:
            _socketio.start_background_task(lambda: _socketio.emit("new_event", {"count": len(buffer), "items": buffer}, namespace="/"))
        except Exception:
            pass


def emit_new_event(evt):
    """Enqueue event for background emit. Non-blocking.

    Compatible with previous API: callers can pass full event dicts.
    """
    try:
        _emit_q.put_nowait(evt)
    except queue.Full:
        # drop silently (prefer availability over backlog)
        return


def shutdown_socket_manager(timeout=2):
    """Stop background worker gracefully."""
    _stop_worker.set()
    if _worker_thr and _worker_thr.is_alive():
        _worker_thr.join(timeout=timeout)

