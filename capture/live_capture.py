# backend/capture/live_capture.py
# Flow-aware live capture supporting both BCC (per-packet) and CICIDS (flow-aggregated)
import os
import time
import threading
import queue
from datetime import datetime
from collections import defaultdict, deque
import numpy as np
from scapy.all import sniff, IP, TCP, UDP  # keep scapy usage
import joblib

from utils.logger import push_event
from socket_manager import emit_new_event
from utils.model_selector import get_active_model, load_model

# -------------------------
# Tunables
# -------------------------
CAPTURE_QUEUE_MAX = 5000
PROCESS_BATCH_SIZE = 40
EMIT_INTERVAL = 0.5
BPF_FILTER = "tcp or udp"
SAMPLE_RATE = 0.45
THROTTLE_PER_PACKET = 0.02

# Flow builder tunables
FLOW_IDLE_TIMEOUT = 1.5        # seconds of inactivity -> expire flow
FLOW_PACKET_THRESHOLD = 50     # force flush if many packets
FLOW_MAX_TRACKED = 20000       # limit number of active flows tracked to avoid memory explosion

# -------------------------
# Internal state
# -------------------------
_packet_queue = queue.Queue(maxsize=CAPTURE_QUEUE_MAX)
_running = threading.Event()
_last_emit = 0.0

# Flow table and lock
_flows = dict()          # flow_key -> Flow object
_flows_lock = threading.Lock()

# background threads
_processor_thr = None
_capture_thr = None
_expiry_thr = None

# -------------------------
# Flow data container
# -------------------------
class Flow:
    def __init__(self, first_pkt, ts):
        # 5-tuple key derived externally
        self.first_seen = ts
        self.last_seen = ts
        self.packets_total = 0
        self.packets_fwd = 0
        self.packets_bwd = 0
        self.bytes_fwd = 0
        self.bytes_bwd = 0
        self.fwd_lens = []      # for mean
        self.bwd_lens = []
        self.inter_arrivals = []    # global IATs across flow
        self.last_pkt_ts = ts
        self.fwd_psh = 0
        self.fwd_urg = 0
        self.protocol = 6 if first_pkt.haslayer(TCP) else (17 if first_pkt.haslayer(UDP) else 0)
        # store client/server ip+port orientation based on first packet's src/dst
        self.client_ip = first_pkt[IP].src
        self.server_ip = first_pkt[IP].dst
        self.client_port = first_pkt.sport if hasattr(first_pkt, 'sport') else 0
        self.server_port = first_pkt.dport if hasattr(first_pkt, 'dport') else 0

    def update(self, pkt, ts):
        self.packets_total += 1
        # Determine direction relative to initial client/server
        try:
            src = pkt[IP].src
            sport = pkt.sport if hasattr(pkt, 'sport') else 0
            payload = bytes(pkt.payload) if pkt.payload else b""
            plen = len(payload)
        except Exception:
            src = None; sport = 0; plen = 0

        # if src equals initial client, it's forward
        if src == self.client_ip and sport == self.client_port:
            dir_fwd = True
        else:
            dir_fwd = False

        if dir_fwd:
            self.packets_fwd += 1
            self.bytes_fwd += plen
            self.fwd_lens.append(plen)
            # flags
            if pkt.haslayer(TCP):
                flags = pkt[TCP].flags
                if flags & 0x08:  # PSH
                    self.fwd_psh += 1
                if flags & 0x20:  # URG
                    self.fwd_urg += 1
        else:
            self.packets_bwd += 1
            self.bytes_bwd += plen
            self.bwd_lens.append(plen)

        # inter-arrival
        iat = ts - (self.last_pkt_ts or ts)
        if iat > 0:
            self.inter_arrivals.append(iat)
        self.last_pkt_ts = ts
        self.last_seen = ts

    def is_idle(self, now, idle_timeout):
        return (now - self.last_seen) >= idle_timeout

    def build_cicids_features(self, dst_port_override=None):
        """
        Build feature vector matching:
        ['Protocol', 'Dst Port', 'Flow Duration', 'Tot Fwd Pkts', 'Tot Bwd Pkts',
         'TotLen Fwd Pkts', 'TotLen Bwd Pkts', 'Fwd Pkt Len Mean', 'Bwd Pkt Len Mean',
         'Flow IAT Mean', 'Fwd PSH Flags', 'Fwd URG Flags', 'Fwd IAT Mean']
        -> returns list of floats/ints
        """
        duration = max(self.last_seen - self.first_seen, 0.000001)
        tot_fwd = self.packets_fwd
        tot_bwd = self.packets_bwd
        totlen_fwd = float(self.bytes_fwd)
        totlen_bwd = float(self.bytes_bwd)
        fwd_mean = float(np.mean(self.fwd_lens)) if self.fwd_lens else 0.0
        bwd_mean = float(np.mean(self.bwd_lens)) if self.bwd_lens else 0.0
        flow_iat_mean = float(np.mean(self.inter_arrivals)) if self.inter_arrivals else 0.0
        fwd_iat_mean = self._fwd_iat_mean()
        proto = int(self.protocol)
        # FIXED: respect explicit override even if zero
        dst_port = self.server_port if dst_port_override is None else int(dst_port_override or 0)

        return [
            proto,
            dst_port,
            duration,
            tot_fwd,
            tot_bwd,
            totlen_fwd,
            totlen_bwd,
            fwd_mean,
            bwd_mean,
            flow_iat_mean,
            self.fwd_psh,
            self.fwd_urg,
            fwd_iat_mean
        ]

    def _fwd_iat_mean(self):
        # approximate forward-only IATs by splitting inter_arrivals roughly (coarse)
        # If we had per-direction timestamps we would measure precisely;
        # here we approximate as global mean when forward packets exist.
        if self.inter_arrivals and self.packets_fwd > 0:
            return float(np.mean(self.inter_arrivals))
        return 0.0

# -------------------------
# helpers: flow key
# -------------------------
def make_flow_key(pkt):
    try:
        ip = pkt[IP]
        proto = 6 if pkt.haslayer(TCP) else (17 if pkt.haslayer(UDP) else 0)
        sport = pkt.sport if hasattr(pkt, 'sport') else 0
        dport = pkt.dport if hasattr(pkt, 'dport') else 0
        # canonicalize tuple order to consider direction
        return (ip.src, ip.dst, sport, dport, proto)
    except Exception:
        return None

# -------------------------
# queueing / sniff simple wrappers
# -------------------------
def _enqueue(pkt):
    try:
        _packet_queue.put_nowait((pkt, time.time()))
    except queue.Full:
        return

def _packet_capture_worker(iface=None):
    sniff(iface=iface, prn=_enqueue, store=False, filter=BPF_FILTER)

# -------------------------
# Expiry thread: periodically expire idle flows
# -------------------------
def _expiry_worker():
    while _running.is_set():
        time.sleep(0.5)
        now = time.time()
        to_flush = []
        with _flows_lock:
            keys = list(_flows.keys())
            for k in keys:
                f = _flows.get(k)
                if f is None:
                    continue
                if f.is_idle(now, FLOW_IDLE_TIMEOUT) or f.packets_total >= FLOW_PACKET_THRESHOLD:
                    to_flush.append(k)

        if to_flush:
            _process_and_emit_flows(to_flush)

# -------------------------
# core: process queue, update flows, flush when needed
# -------------------------
def _processor_worker():
    global _last_emit
    # lazy load initial model bundle
    active = get_active_model()
    model_bundle = load_model(active)
    processor_model = model_bundle.get("model")
    processor_scaler = model_bundle.get("scaler") or (model_bundle.get("artifacts") and model_bundle["artifacts"].get("scaler"))
    processor_encoder = model_bundle.get("encoder") or (model_bundle.get("artifacts") and model_bundle["artifacts"].get("label_encoder"))

    batch = []
    while _running.is_set():
        # refresh model if switched
        new_active = get_active_model()
        if new_active != active:
            active = new_active
            model_bundle = load_model(active)
            processor_model = model_bundle.get("model")
            processor_scaler = model_bundle.get("scaler") or (model_bundle.get("artifacts") and model_bundle["artifacts"].get("scaler"))
            processor_encoder = model_bundle.get("encoder") or (model_bundle.get("artifacts") and model_bundle["artifacts"].get("label_encoder"))
            print(f"[live_capture] switched active model to {active}")

        try:
            pkt, ts = _packet_queue.get(timeout=0.5)
        except queue.Empty:
            # flush small batches if exist (not required)
            continue

        # sampling, ignore some traffic
        if np.random.rand() > SAMPLE_RATE:
            continue
        if not pkt.haslayer(IP):
            continue

        # BCC path: still do per-packet predictions if active 'bcc'
        if active == "bcc":
            batch.append((pkt, ts))
            if len(batch) >= PROCESS_BATCH_SIZE or _packet_queue.empty():
                _process_bcc_batch(batch, processor_model, processor_scaler, processor_encoder)
                batch.clear()
            continue

        # CICIDS path: update flow table
        key = make_flow_key(pkt)
        if key is None:
            continue

        # Prevent runaway flows table
        with _flows_lock:
            if len(_flows) > FLOW_MAX_TRACKED:
                # flush oldest flows (heuristic) to free space
                # choose keys ordered by last_seen
                items = list(_flows.items())
                items.sort(key=lambda kv: kv[1].last_seen)
                n_to_remove = int(len(items) * 0.1) or 100
                keys_to_flush = [k for k, _ in items[:n_to_remove]]
                # flush asynchronously
                threading.Thread(target=_process_and_emit_flows, args=(keys_to_flush,), daemon=True).start()

            flow = _flows.get(key)
            if flow is None:
                # new flow
                flow = Flow(pkt, ts)
                _flows[key] = flow

        # update outside big lock (Flow.update is mostly per-flow)
        flow.update(pkt, ts)

        # flush immediately if surpass threshold
        if flow.packets_total >= FLOW_PACKET_THRESHOLD:
            _process_and_emit_flows([key])

    # when stopped, flush all
    with _flows_lock:
        keys = list(_flows.keys())
    if keys:
        _process_and_emit_flows(keys)


# -------------------------
# Process BCC batch (existing behavior)
# -------------------------
def _process_bcc_batch(batch, model, scaler, encoder):
    events = []
    features_list = []
    for pkt, ts in batch:
        # reuse earlier extraction (simple)
        features = _extract_bcc_vector(pkt)
        features_list.append(features)

    X = np.asarray(features_list, dtype=float)
    if scaler is not None:
        try:
            Xs = scaler.transform(X)
        except Exception:
            Xs = X
    else:
        Xs = X

    if model is not None:
        try:
            preds = model.predict(Xs)
            probs = model.predict_proba(Xs) if hasattr(model, "predict_proba") else None
        except Exception as e:
            preds = [None] * len(Xs)
            probs = None
            print("[live_capture] BCC model predict failed:", e)
    else:
        preds = [None] * len(Xs)
        probs = None

    for i, (pkt, ts) in enumerate(batch):
        pred = preds[i]
        conf = float(np.max(probs[i])) if (probs is not None and len(probs) > i) else None
        try:
            decoded = encoder.inverse_transform([int(pred)])[0] if encoder else str(pred)
        except Exception:
            decoded = str(pred)

        evt = {
            "time": datetime.now().strftime("%H:%M:%S"),
            "src_ip": pkt[IP].src,
            "dst_ip": pkt[IP].dst,
            "sport": (pkt.sport if (pkt.haslayer(TCP) or pkt.haslayer(UDP)) else 0),
            "dport": (pkt.dport if (pkt.haslayer(TCP) or pkt.haslayer(UDP)) else 0),
            "proto": "TCP" if pkt.haslayer(TCP) else ("UDP" if pkt.haslayer(UDP) else "OTHER"),
            "prediction": decoded,
            "confidence": conf if conf is None or isinstance(conf, float) else float(conf),
            "packet_meta": extract_packet_metadata(pkt)   # <-- NEW
}

        try:
            push_event(evt)
        except Exception:
            pass
        events.append(evt)

    # emit once per batch
    if events:
        try:
            emit_new_event({"items": events, "count": len(events)})
        except Exception:
            pass


def _extract_bcc_vector(pkt):
    # this matches your old extract_bcc_features but kept minimal and robust
    try:
        proto = 6 if pkt.haslayer(TCP) else (17 if pkt.haslayer(UDP) else 1)
        src_port = pkt.sport if pkt.haslayer(TCP) or pkt.haslayer(UDP) else 0
        dst_port = pkt.dport if pkt.haslayer(TCP) or pkt.haslayer(UDP) else 0

        payload = bytes(pkt.payload) if pkt.payload else b""
        plen = len(payload)
        header = max(len(pkt) - plen, 0)

        syn = 1 if pkt.haslayer(TCP) and pkt[TCP].flags & 0x02 else 0
        ack = 1 if pkt.haslayer(TCP) and pkt[TCP].flags & 0x10 else 0
        rst = 1 if pkt.haslayer(TCP) and pkt[TCP].flags & 0x04 else 0
        fin = 1 if pkt.haslayer(TCP) and pkt[TCP].flags & 0x01 else 0

        return [
            proto,
            src_port,
            dst_port,
            0.001,
            1,
            1,
            0,
            plen,
            header,
            plen / 0.002 if 0.002 else plen,
            1 / 0.002 if 0.002 else 1,
            syn,
            ack,
            rst,
            fin
        ]
    except Exception:
        return [0] * 15


# -------------------------
# Packet-level metadata extractor
# -------------------------
def extract_packet_metadata(pkt):
    """Extract detailed packet-level metadata for frontend display."""
    meta = {}

    # IP-level metadata
    try:
        meta["ttl"] = pkt[IP].ttl if pkt.haslayer(IP) else None
        meta["pkt_len"] = len(pkt)
    except:
        meta["ttl"] = None
        meta["pkt_len"] = None

    # TCP metadata
    if pkt.haslayer(TCP):
        tcp = pkt[TCP]
        try:
            meta["seq"] = int(tcp.seq)
            meta["ack"] = int(tcp.ack)
            meta["window"] = int(tcp.window)
            meta["flags"] = str(tcp.flags)
            meta["header_len"] = tcp.dataofs * 4  # Data offset (words)
        except:
            meta["seq"] = None
            meta["ack"] = None
            meta["window"] = None
            meta["flags"] = None
            meta["header_len"] = None
    else:
        meta["seq"] = None
        meta["ack"] = None
        meta["window"] = None
        meta["flags"] = None
        meta["header_len"] = None

    # Payload length
    try:
        payload = bytes(pkt.payload)
        meta["payload_len"] = len(payload)
    except:
        meta["payload_len"] = None

    return meta

# -------------------------
# flush flows and emit/predict
# -------------------------
def _process_and_emit_flows(keys):
    # keys: list of flow_keys to flush; safe to call from any thread
    # collect features for predict, delete flows
    to_predict = []
    mapping = []  # keep (flow_key, flow_obj) for events
    with _flows_lock:
        for k in keys:
            f = _flows.pop(k, None)
            if f:
                mapping.append((k, f))

    if not mapping:
        return

    # create features list
    for k, f in mapping:
        feat = f.build_cicids_features()
        to_predict.append((k, f, feat))

    X = np.array([t[2] for t in to_predict], dtype=float)
    # lazy load latest model bundle (in case switching)
    active = get_active_model()
    bundle = load_model(active)
    model = bundle.get("model")
    scaler = None
    artifacts = bundle.get("artifacts")

    # try to get scaler from bundle/artifacts
    if bundle.get("scaler") is not None:
        scaler = bundle.get("scaler")
    elif artifacts and artifacts.get("scaler") is not None:
        scaler = artifacts.get("scaler")

    if scaler is not None:
        try:
            # If scaler expects dataframe shape, it should still accept ndarray
            Xs = scaler.transform(X)
        except Exception as e:
            print("[live_capture] cicids scaler transform failed:", e)
            Xs = X
    else:
        Xs = X

    preds = []
    probs = None
    if model is not None:
        try:
            preds = model.predict(Xs)
            if hasattr(model, "predict_proba"):
                try:
                    probs = model.predict_proba(Xs)
                except Exception:
                    probs = None
        except Exception as e:
            print("[live_capture] cicids model predict failed:", e)
            preds = [None] * len(Xs)
            probs = None
    else:
        preds = [None] * len(Xs)

    # build events and emit/push
    events = []
    for i, (k, f, feat) in enumerate(to_predict):
        pred = preds[i]
        conf = float(np.max(probs[i])) if (probs is not None and len(probs) > i) else None

        # -------------------------
        # SIMPLIFIED LABEL DECODING
        # -------------------------
        # Your RF pipeline outputs string labels directly (e.g. 'DoS attacks-Hulk', 'BENIGN').
        # So keep it simple and safe:
        try:
            label = str(pred)
        except Exception:
            label = repr(pred)

        evt = {
            "time": datetime.now().strftime("%H:%M:%S"),
            "src_ip": f.client_ip,
            "dst_ip": f.server_ip,
            "sport": f.client_port,
            "dport": f.server_port,
            "proto": "TCP" if f.protocol == 6 else ("UDP" if f.protocol == 17 else "OTHER"),
            "prediction": label,
            "confidence": conf if conf is None or isinstance(conf, float) else float(conf),
            "features": feat,
            "flow_summary": {
                "packets_fwd": f.packets_fwd,
                "packets_bwd": f.packets_bwd,
                "bytes_fwd": f.bytes_fwd,
                "bytes_bwd": f.bytes_bwd,
                "duration": f.last_seen - f.first_seen,
                "fwd_mean_len": float(np.mean(f.fwd_lens)) if f.fwd_lens else 0.0
    }
}

        try:
            push_event(evt)
        except Exception:
            pass
        events.append(evt)

    if events:
        try:
            emit_new_event({"items": events, "count": len(events)})
        except Exception:
            pass

# -------------------------
# start/stop API (keeps your old signatures)
# -------------------------
def start_live_capture_packet_mode(iface=None):
    """Start packet capture + processor + expiry threads."""
    global _processor_thr, _capture_thr, _expiry_thr
    if _running.is_set():
        print("Already running")
        return
    _running.set()
    _processor_thr = threading.Thread(target=_processor_worker, daemon=True)
    _capture_thr = threading.Thread(target=_packet_capture_worker, kwargs={"iface": iface}, daemon=True)
    _expiry_thr = threading.Thread(target=_expiry_worker, daemon=True)
    _processor_thr.start()
    _capture_thr.start()
    _expiry_thr.start()
    print("Live capture started (flow-aware)")

def stop_live_capture():
    _running.clear()
    time.sleep(0.2)
    # flush all flows and stop
    with _flows_lock:
        keys = list(_flows.keys())
    if keys:
        _process_and_emit_flows(keys)
    print("Stopping capture...")

def is_running():
    return _running.is_set()

# -------------------------
# Small test helpers (simulate simple flow packets)
# -------------------------
def _make_fake_pkt(src, dst, sport, dport, proto='TCP', payload_len=100, flags=0x18):
    """Return a tiny object resembling scapy packet for testing without scapy."""
    # If scapy present prefer to build actual IP/TCP
    try:
        if proto.upper() == 'TCP':
            from scapy.all import IP, TCP
            pkt = IP(src=src, dst=dst)/TCP(sport=sport, dport=dport, flags=flags)/("X"*payload_len)
            return pkt
        elif proto.upper() == 'UDP':
            from scapy.all import IP, UDP
            pkt = IP(src=src, dst=dst)/UDP(sport=sport, dport=dport)/("X"*payload_len)
            return pkt
    except Exception:
        # fallback plain namespace
        class SimplePkt:
            def __init__(self):
                self.payload = b"X"*payload_len
                self.len = payload_len + 40
            def haslayer(self, cls):
                return False
        return SimplePkt()

def simulate_flow(src="10.0.0.1", dst="10.0.0.2", sport=1234, dport=80, count=6, interval=0.1):
    """Quick local simulator: pushes `count` fake packets for a flow into the queue."""
    for i in range(count):
        pkt = _make_fake_pkt(src, dst, sport, dport, proto='TCP', payload_len=100, flags=0x18)
        _enqueue((pkt, time.time())) if False else _packet_queue.put_nowait((pkt, time.time()))
        time.sleep(interval)

# ----------------------------------------------------------------------------
# If you want to test this module interactively:
# 1) from backend.capture import live_capture
# 2) live_capture.start_live_capture_packet_mode()
# 3) call live_capture.simulate_flow(...) or send real packets
# 4) view server logs, or GET /api/live/recent to see events (existing route)
# ----------------------------------------------------------------------------


