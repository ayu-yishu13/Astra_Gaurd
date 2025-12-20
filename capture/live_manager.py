# live_manager.py (Optimized)
# -------------------------------------------------------------
import threading
import time
from typing import Optional
from .live_capture import start_live_capture_packet_mode, stop_live_capture, is_running
from utils.logger import get_recent_events, get_model_stats, get_active_model


class LiveSniffer:
    def __init__(self):
        self._thr: Optional[threading.Thread] = None
        self._lock = threading.Lock()
        self._iface = None
        self._last_start_time = None

    def start(self, iface=None, packet_limit=0):
        with self._lock:
            if is_running():
                print("Already running.")
                return
            self._iface = iface
            self._last_start_time = time.strftime("%H:%M:%S")

        def _worker():
            print(f"LiveSniffer started on interface={iface or 'default'}")
            try:
                # FIX: start_live_capture_packet_mode signature accepts iface only
                start_live_capture_packet_mode(iface=self._iface)
            except Exception as e:
                print("Sniffer error:", e)
            print("LiveSniffer thread exit.")

        self._thr = threading.Thread(target=_worker, daemon=True)
        self._thr.start()

    def stop(self):
        with self._lock:
            if not is_running():
                print("Already stopped.")
                return
        stop_live_capture()

        if self._thr and self._thr.is_alive():
            self._thr.join(timeout=3)
        print("Sniffer fully stopped.")

    def is_running(self) -> bool:
        return is_running()

    
    def recent(self, n=200):
        return get_recent_events(get_active_model(), n)
    def stats(self):
        return get_model_stats(get_active_model())

sniffer = LiveSniffer()
