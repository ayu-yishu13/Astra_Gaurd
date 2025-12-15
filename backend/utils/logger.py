# logger.py (Model-separated, non-blocking logger, per-model CSVs)
# -------------------------------------------------------------
import os
import csv
import threading
import time
from datetime import datetime
import numpy as np

LOG_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "logs"))
os.makedirs(LOG_DIR, exist_ok=True)

BCC_LOG_FILE = os.path.join(LOG_DIR, "bcc_logs.csv")
CICIDS_LOG_FILE = os.path.join(LOG_DIR, "cicids_logs.csv")

_MAX_RECENT = 500
_FLUSH_INTERVAL = 2.0
_FLUSH_BATCH = 50

_headers = [
    "time", "src_ip", "sport", "dst_ip", "dport", "proto",
    "prediction", "risk_level", "risk_score",
    "src_country", "src_city", "src_lat", "src_lon",
    "dst_country", "dst_city", "dst_lat", "dst_lon"
]

# In-memory per-model buffers & stats
_model_events = {
    "bcc": [],       # list of dicts
    "cicids": []
}

_model_stats = {
    "bcc": {},
    "cicids": {}
}

# active model (default)
_active_model_lock = threading.Lock()
_active_model = "bcc"

# writer buffers and locks
_write_buffer = []   # list of dicts, each item must include "model" key
_buffer_lock = threading.Lock()
_events_lock = threading.Lock()

_stop_writer = threading.Event()

# -------------------------
# Helpers: file name for model
# -------------------------
def _file_for_model(model):
    if model == "cicids":
        return CICIDS_LOG_FILE
    return BCC_LOG_FILE

# -------------------------
# Full overwrite for a model CSV
# -------------------------
def _flush_full_overwrite_model(model):
    """Rewrite the entire CSV for a specific model from its in-memory buffer."""
    fname = _file_for_model(model)
    try:
        with _events_lock:
            rows = list(_model_events.get(model, []))
        with open(fname, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=_headers)
            writer.writeheader()
            for row in rows:
                writer.writerow({k: row.get(k, "") for k in _headers})
        # optional debug print
        # print(f"[logger] {model} CSV fully rewritten: {len(rows)} rows -> {fname}")
    except Exception as e:
        print("[logger] Full overwrite failed:", e)

# -------------------------
# Flush small batches to disk (append)
# -------------------------
def _flush_to_disk():
    global _write_buffer
    with _buffer_lock:
        if not _write_buffer:
            return
        batch = _write_buffer[:_FLUSH_BATCH]
        _write_buffer = _write_buffer[len(batch):]

    # group by model for efficient writes
    groups = {}
    for row in batch:
        m = row.get("model", "bcc")
        groups.setdefault(m, []).append(row)

    for model, rows in groups.items():
        fname = _file_for_model(model)
        try:
            file_empty = not os.path.exists(fname) or os.stat(fname).st_size == 0
            with open(fname, "a", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=_headers)
                if file_empty:
                    writer.writeheader()
                for r in rows:
                    # write only header keys (ignore extra)
                    writer.writerow({k: r.get(k, "") for k in _headers})
        except Exception as e:
            print("[logger] Append write error for", model, ":", e)

# -------------------------
# Background writer thread
# -------------------------
def _writer_thread():
    while not _stop_writer.is_set():
        time.sleep(_FLUSH_INTERVAL)
        _flush_to_disk()
    # flush remaining on shutdown
    _flush_to_disk()

_writer_thr = threading.Thread(target=_writer_thread, daemon=True)
_writer_thr.start()

# -------------------------
# Load existing CSVs into _model_events on startup (keep last _MAX_RECENT)
# -------------------------
def _load_recent_model(model):
    fname = _file_for_model(model)
    if not os.path.exists(fname):
        return []
    try:
        with open(fname, "r", encoding="utf-8") as f:
            reader = list(csv.DictReader(f))
            return reader[-_MAX_RECENT:]
    except Exception:
        return []

def _load_all_recent():
    global _model_events
    with _events_lock:
        _model_events["bcc"] = _load_recent_model("bcc")
        _model_events["cicids"] = _load_recent_model("cicids")

_load_all_recent()

# ===============================
# Public API: push_event
# ===============================
def push_event(evt):
    """
    evt: dict containing event fields expected (prediction, src_ip, dst_ip, etc.)
    Uses current active model to store event.
    Also enqueues to write buffer for background flush.
    """
    global _write_buffer

    # attach model at time of push
    with _active_model_lock:
        model = _active_model

    e = dict(evt)
    e.setdefault("time", datetime.now().strftime("%H:%M:%S"))
    e.setdefault("risk_level", "Low")
    e.setdefault("risk_score", 0)

    # add to in-memory buffer for model
    with _events_lock:
        _model_events.setdefault(model, [])
        _model_events[model].append(e)
        if len(_model_events[model]) > _MAX_RECENT:
            _model_events[model] = _model_events[model][-_MAX_RECENT:]

        # update stats
        pred = str(e.get("prediction", "Unknown"))
        _model_stats.setdefault(model, {})
        _model_stats[model][pred] = _model_stats[model].get(pred, 0) + 1

    # add to write buffer with model tag for background writer
    item = dict(e)
    item["model"] = model
    with _buffer_lock:
        _write_buffer.append(item)
        # if buffer grows big, flush asynchronously
        if len(_write_buffer) > (_FLUSH_BATCH * 4):
            threading.Thread(target=_flush_to_disk, daemon=True).start()

# ===============================
# Public API: get recent & stats
# ===============================
def get_recent_events(model="bcc", n=None):
    with _events_lock:
        data = list(_model_events.get(model, []))
    if n:
        return data[-n:]
    return data

def get_model_stats(model="bcc"):
    with _events_lock:
        # return a shallow copy to avoid external mutation
        return dict(_model_stats.get(model, {}))

# -------------------------
# Convenience: summary across active model (legacy)
# -------------------------
def summarize_counts():
    with _active_model_lock:
        model = _active_model
    return get_model_stats(model)

# ===============================
# Model selection API
# ===============================
def set_active_model(model):
    if model not in ("bcc", "cicids"):
        raise ValueError("invalid model")
    with _active_model_lock:
        global _active_model
        _active_model = model
    # no immediate clearing — in-memory buffers persist per model
    return _active_model

def get_active_model():
    with _active_model_lock:
        return _active_model

# ===============================
# CLEAR / DELETE (model-wise)
# ===============================
def clear_last_events(model="bcc", n=99999):
    with _events_lock:
        ev = _model_events.get(model, [])
        if n >= len(ev):
            _model_events[model] = []
        else:
            _model_events[model] = ev[:-n]
        # reset stats for this model
        _model_stats[model] = {}
    # rewrite model CSV fully
    _flush_full_overwrite_model(model)
    return True

def delete_by_index(model="bcc", idx=0):
    with _events_lock:
        ev = _model_events.get(model, [])
        if 0 <= idx < len(ev):
            ev.pop(idx)
            _model_events[model] = ev
            # recompute stats (simple recompute)
            _model_stats[model] = {}
            for e in ev:
                pred = str(e.get("prediction", "Unknown"))
                _model_stats[model][pred] = _model_stats[model].get(pred, 0) + 1
            _flush_full_overwrite_model(model)
            return True
    return False

def delete_by_prediction(model="bcc", pred=None):
    if pred is None:
        return False
    with _events_lock:
        ev = _model_events.get(model, [])
        _model_events[model] = [e for e in ev if e.get("prediction") != pred]
        # recompute stats
        _model_stats[model] = {}
        for e in _model_events[model]:
            p = str(e.get("prediction", "Unknown"))
            _model_stats[model][p] = _model_stats[model].get(p, 0) + 1
    _flush_full_overwrite_model(model)
    return True

# ===============================
# Shutdown
# ===============================
def shutdown_logger():
    _stop_writer.set()
    _writer_thr.join(timeout=3)

