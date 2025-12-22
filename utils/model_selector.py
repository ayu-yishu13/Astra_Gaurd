import os
import joblib
import threading
import traceback
from huggingface_hub import hf_hub_download
import sklearn.utils
# --- CONFIGURATION ---
HF_REPO_ID = "CodebaseAi/netraids-ml-models"  # Replace with your actual public repo ID
# ---------------------

ACTIVE_MODEL = "bcc"
_ACTIVE_LOCK = threading.Lock()
_MODEL_CACHE = {}

# --- PATCH FOR SKLEARN 1.6+ COMPATIBILITY ---
# This fixes the "cannot import name 'parse_version' from 'sklearn.utils'" error
if not hasattr(sklearn.utils, 'parse_version'):
    import packaging.version
    def parse_version(v):
        return packaging.version.parse(v)
    sklearn.utils.parse_version = parse_version
# --------------------------------------------

# 1. FIXED PATH LOGIC:
# __file__ is /app/utils/model_selector.py
# dirname(__file__) is /app/utils
# dirname(dirname(...)) is /app (the ROOT)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ML_DIR = os.path.join(BASE_DIR, "ml_models")

# Ensure the local ml_models directory exists for caching
if not os.path.exists(ML_DIR):
    os.makedirs(ML_DIR, exist_ok=True)

print(f"[model_selector] ROOT BASE_DIR: {BASE_DIR}")
print(f"[model_selector] ML_DIR: {ML_DIR}")

def _get_model_path(filename):
    """
    First looks in the local 'ml_models' folder. 
    If not found, downloads from the public Hugging Face Hub.
    """
    local_path = os.path.join(ML_DIR, filename)
    
    # 1. Check if the file is already there
    if os.path.exists(local_path):
        return local_path
    
    # 2. Download from Hub if missing
    try:
        print(f"[model_selector] {filename} not found locally. Downloading from Hub...")
        # We specify local_dir to force it into our ml_models folder
        downloaded_path = hf_hub_download(
            repo_id=HF_REPO_ID, 
            filename=filename,
            local_dir=ML_DIR
        )
        return downloaded_path
    except Exception as e:
        print(f"[model_selector] ERROR: Could not find/download {filename}: {e}")
        return None

def _try_load(filename):
    path = _get_model_path(filename)
    if not path or not os.path.exists(path):
        print(f"[model_selector] SKIP: {filename} path invalid.")
        return None
    try:
        # Check if file size is > 0 before loading
        if os.path.getsize(path) == 0:
            print(f"[model_selector] ERROR: {filename} is an empty file.")
            return None
            
        print(f"[model_selector] Attempting joblib.load for {filename}")
        return joblib.load(path)
    except Exception as e:
        print(f"[model_selector] CRITICAL FAILED to load {filename}")
        print(traceback.format_exc()) # This will show exactly why in HF logs
        return None

def load_model(model_key):
    if model_key in _MODEL_CACHE:
        return _MODEL_CACHE[model_key]

    if model_key == "bcc":
        _MODEL_CACHE["bcc"] = {
            "model": _try_load("realtime_model.pkl"),
            "scaler": _try_load("realtime_scaler.pkl"),
            "encoder": _try_load("realtime_encoder.pkl")
        }
        return _MODEL_CACHE["bcc"]

    if model_key == "cicids":
        # It will look for your RF files in the Hub
        _MODEL_CACHE["cicids"] = {
            "model": _try_load("rf_pipeline.joblib"),
            "artifacts": _try_load("training_artifacts.joblib")
        }
        return _MODEL_CACHE["cicids"]

    raise ValueError(f"Unknown model_key: {model_key}")

def set_active_model(key: str):
    global ACTIVE_MODEL
    with _ACTIVE_LOCK:
        ACTIVE_MODEL = key
    print(f"[model_selector] ACTIVE_MODEL set to: {ACTIVE_MODEL}")

def get_active_model():
    return ACTIVE_MODEL

