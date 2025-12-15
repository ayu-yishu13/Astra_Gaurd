import os
import joblib
import threading
import traceback

# Global active model (default = bcc so your current flow remains unchanged)
ACTIVE_MODEL = "bcc"
_ACTIVE_LOCK = threading.Lock()

# Cache loaded models to avoid repeated disk loads
_MODEL_CACHE = {}
ML_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ml_models"))
print("[model_selector] ML_DIR =", ML_DIR)
try:
    print("[model_selector] ML_DIR files:", os.listdir(ML_DIR))
except Exception as e:
    print("[model_selector] Could not list ML_DIR:", e)


def _try_load(path):
    """Try to joblib.load(path). On failure return None but print full traceback."""
    if not os.path.exists(path):
        print(f"[model_selector] SKIP (not found): {path}")
        return None
    try:
        print(f"[model_selector] Attempting to load: {path}")
        obj = joblib.load(path)
        print(f"[model_selector] Successfully loaded: {os.path.basename(path)}")
        return obj
    except Exception as e:
        print(f"[model_selector] FAILED to load {path}: {e}")
        traceback.print_exc()
        return None

def load_model(model_key):
    """Return a dict with keys depending on model. Caches result."""
    if model_key in _MODEL_CACHE:
        return _MODEL_CACHE[model_key]

    if model_key == "bcc":
        # original BCC artifact names (your working files)
        model_path = os.path.join(ML_DIR, "realtime_model.pkl")
        scaler_path = os.path.join(ML_DIR, "realtime_scaler.pkl")
        encoder_path = os.path.join(ML_DIR, "realtime_encoder.pkl")

        model = _try_load(model_path)
        scaler = _try_load(scaler_path)
        encoder = _try_load(encoder_path)

        if model is None:
            print(f"[model_selector] WARNING: bcc model not found at {model_path}")
        _MODEL_CACHE["bcc"] = {"model": model, "scaler": scaler, "encoder": encoder}
        return _MODEL_CACHE["bcc"]

    if model_key == "cicids":
        # Prefer the RF pipeline you requested; try common names in preferred order
        candidate_models = [
            "rf_pipeline.joblib",        # preferred - your RF pipeline
            "cicids_rf.joblib",
            "rf_pipeline.pkl",
            "cicids_model.joblib",
            "lgb_pipeline.joblib",
            "cicids_rf.pkl",
        ]
        # prefer 'training_artifacts' or 'cicids_artifacts'
        candidate_artifacts = [
            "training_artifacts.joblib",
            "training_artifacts.pkl",
            "cicids_artifacts.joblib",
            "cicids_artifacts.pkl",
            "artifacts.joblib",
            "artifacts.pkl"
        ]

        model = None
        artifacts = None
        for fn in candidate_models:
            p = os.path.join(ML_DIR, fn)
            model = _try_load(p)
            if model is not None:
                print(f"[model_selector] Loaded cicids model from {p}")
                break

        for fn in candidate_artifacts:
            p = os.path.join(ML_DIR, fn)
            artifacts = _try_load(p)
            if artifacts is not None:
                print(f"[model_selector] Loaded cicids artifacts from {p}")
                break

        if model is None:
            print("[model_selector] WARNING: No cicids model found in ml_models.")
        if artifacts is None:
            print("[model_selector] WARNING: No cicids artifacts found in ml_models.")

        # artifacts expected to include: 'scaler' and 'features' at minimum
        _MODEL_CACHE["cicids"] = {
            "model": model,
            "artifacts": artifacts
        }
        return _MODEL_CACHE["cicids"]

    raise ValueError("Unknown model_key")

def set_active_model(key: str):
    global ACTIVE_MODEL
    if key not in ("bcc", "cicids"):
        raise ValueError("Active model must be 'bcc' or 'cicids'")
    with _ACTIVE_LOCK:
        ACTIVE_MODEL = key
    print(f"[model_selector] ACTIVE_MODEL set to: {ACTIVE_MODEL}")

def get_active_model():
    return ACTIVE_MODEL


