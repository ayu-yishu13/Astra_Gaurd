from flask import Blueprint, request, jsonify
from utils.model_selector import get_active_model, load_model
import numpy as np
import traceback
import math
import json

manual_predict = Blueprint("manual_predict", __name__)


def _reliability_score_from_count(count):
    # simple monotonic score: log-scale so diminishing returns for many samples
    # returns 0-100
    if count is None:
        return None
    try:
        c = float(count)
        score = 20 + min(75, math.log10(c + 1) * 18)  # tuned curve
        return round(min(100, score), 1)
    except Exception:
        return None


@manual_predict.route("/predict_manual", methods=["POST"])
def predict_manual():
    data = request.get_json(force=True, silent=True) or {}

    model_name = data.get("model")
    values = data.get("values")   # expecting a LIST (array)
    if not model_name or not isinstance(values, list):
        return jsonify({
            "error": "Expect JSON: { model: 'cicids'|'bcc', values: [v1, v2, ...] }"
        }), 400

    bundle = load_model(model_name)
    model = bundle.get("model")
    artifacts = bundle.get("artifacts") or {}

    if model is None:
        return jsonify({"error": "Model not loaded"}), 500

    try:
        # Common metadata
        model_info = {
            "model_name": model_name,
            "features": artifacts.get("features") or artifacts.get("feature_list") or bundle.get("features") or None,
            "classes": None,
            "train_counts": artifacts.get("train_counts") or artifacts.get("class_counts") or None,
            "scaler_present": bool(artifacts.get("scaler")) or bool(bundle.get("scaler")),
        }

        # helper to decode label_map / encoder (checks artifacts first, then bundle)
        def decode_label(raw):
            try:
                # artifacts label_map (mapping value->name)
                if artifacts.get("label_map"):
                    inv = {v: k for k, v in artifacts["label_map"].items()}
                    return inv.get(int(raw), str(raw))

                # artifacts label_encoder
                if artifacts.get("label_encoder"):
                    return artifacts["label_encoder"].inverse_transform([int(raw)])[0]

                # bundle-level encoder (e.g. realtime_encoder.pkl loaded in bundle)
                if bundle.get("encoder"):
                    return bundle["encoder"].inverse_transform([int(raw)])[0]
            except Exception as e:
                # decoding failed; log and fallback to str
                print("[decode_label] ERROR:", e)
            # fallback: if raw already a string return it, else stringified raw
            return str(raw)

        # CICIDS (13 features expected)
        if model_name == "cicids":
            feature_list = model_info["features"]
            if not feature_list:
                return jsonify({"error": "CICIDS artifacts missing 'features' list"}), 500

            if len(values) != len(feature_list):
                return jsonify({
                    "error": f"CICIDS needs {len(feature_list)} features, received {len(values)}"
                }), 400

            X = np.array([[float(x) for x in values]], dtype=float)

            # apply scaler if present in artifacts or bundle
            scaler = artifacts.get("scaler") or bundle.get("scaler")
            scaled_row = None
            try:
                if scaler is not None:
                    scaled = scaler.transform(X)
                    scaled_row = np.array(scaled).tolist()
                    Xs = scaled
                else:
                    Xs = X
            except Exception as e:
                # fallback to raw X if scaler fails
                print("[predict_manual][CICIDS] scaler error:", e)
                Xs = X

            # predict
            pred_raw = model.predict(Xs)[0]
            pred_label = decode_label(pred_raw)

            # probabilities
            proba_max = None
            probs = None
            try:
                if hasattr(model, "predict_proba"):
                    p = model.predict_proba(Xs)[0]
                    probs = [float(x) for x in p]
                    proba_max = float(max(p))
            except Exception:
                pass

            # fill model_info.classes if possible (prefer encoder classes)
            try:
                if artifacts.get("label_encoder"):
                    model_info["classes"] = list(artifacts["label_encoder"].classes_)
                elif bundle.get("encoder"):
                    model_info["classes"] = list(bundle["encoder"].classes_)
                elif hasattr(model, "classes_"):
                    model_info["classes"] = [str(c) for c in model.classes_]
            except Exception:
                pass

            # compute reliability
            train_counts = model_info.get("train_counts")
            reliability = None
            if train_counts and isinstance(train_counts, dict):
                # try to get count for the predicted label (string keys)
                reliability = _reliability_score_from_count(
                    train_counts.get(str(pred_label)) or train_counts.get(pred_raw)
                )
            elif train_counts and isinstance(train_counts, list):
                reliability = _reliability_score_from_count(sum(train_counts) / len(train_counts))
            else:
                reliability = None

            resp = {
                "prediction": pred_label,
                "pred_raw": str(pred_raw),
                "confidence": proba_max,
                "proba_max": proba_max,
                "probs": probs,
                "raw_row": X.tolist()[0],
                "scaled_row": scaled_row,
                "model_info": model_info,
                "reliability": reliability
            }
            return jsonify(resp)

        # BCC (15 features expected)
        elif model_name == "bcc":
            EXPECTED = 15
            if len(values) != EXPECTED:
                return jsonify({
                    "error": f"BCC needs {EXPECTED} features, received {len(values)}"
                }), 400

            X = np.array([[float(x) for x in values]], dtype=float)

            scaler = bundle.get("scaler") or artifacts.get("scaler")
            scaled_row = None
            try:
                if scaler is not None:
                    scaled = scaler.transform(X)
                    scaled_row = np.array(scaled).tolist()
                    Xs = scaled
                else:
                    Xs = X
            except Exception as e:
                print("[predict_manual][BCC] scaler error:", e)
                Xs = X

            pred_raw = model.predict(Xs)[0]
            pred_label = decode_label(pred_raw)

            proba_max = None
            probs = None
            try:
                if hasattr(model, "predict_proba"):
                    p = model.predict_proba(Xs)[0]
                    probs = [float(x) for x in p]
                    proba_max = float(max(p))
            except Exception:
                pass

            # model_info classes: prefer encoder classes if present
            try:
                encoder = bundle.get("encoder") or artifacts.get("label_encoder")
                if encoder is not None:
                    model_info["classes"] = list(encoder.classes_)
                elif hasattr(model, "classes_"):
                    # fallback - often these are numeric indices
                    model_info["classes"] = [str(c) for c in model.classes_]
            except Exception:
                pass

            train_counts = model_info.get("train_counts")
            reliability = None
            if train_counts and isinstance(train_counts, dict):
                reliability = _reliability_score_from_count(
                    train_counts.get(str(pred_label)) or train_counts.get(pred_raw)
                )
            elif train_counts:
                reliability = _reliability_score_from_count(sum(train_counts) / len(train_counts))

            resp = {
                "prediction": pred_label,
                "pred_raw": str(pred_raw),
                "confidence": proba_max,
                "proba_max": proba_max,
                "probs": probs,
                "raw_row": X.tolist()[0],
                "scaled_row": scaled_row,
                "model_info": model_info,
                "reliability": reliability
            }
            return jsonify(resp)

        else:
            return jsonify({"error": "unsupported model"}), 400

    except Exception as e:
        print("[predict_manual] Exception:", e)
        return jsonify({"error": str(e)}), 500


@manual_predict.route("/predict_debug", methods=["POST"])
def predict_debug():
    """
    Debug endpoint: returns raw ordered vector, scaled vector (if scaler),
    model classes, prediction, predict_proba (if available), and artifacts info.
    Use this to compare what you *intend* to send vs what model receives.
    """
    try:
        data = request.get_json(force=True, silent=True) or {}
        model_name = data.get("model")
        feats = data.get("features")
        if not model_name or not isinstance(feats, dict):
            return jsonify({"error": "Provide JSON {model: 'cicids'|'bcc', features: {...}}"}), 400

        bundle = load_model(model_name)
        model = bundle.get("model")
        artifacts = bundle.get("artifacts") or {}

        if model is None:
            return jsonify({"error": "Model not loaded"}), 500

        debug = {"model_name": model_name}

        if model_name == "cicids":
            feature_list = artifacts.get("features")
            debug["artifact_features"] = feature_list
            # Build ordered row (float)
            row = [float(feats.get(f, 0.0)) for f in (feature_list or [])]
            debug["raw_row"] = row

            X = np.array([row], dtype=float)

            scaler = artifacts.get("scaler") or bundle.get("scaler")
            if scaler is not None:
                try:
                    Xs = scaler.transform(X)
                    debug["scaled_row"] = np.array(Xs).tolist()
                except Exception as e:
                    debug["scaler_error"] = str(e)
                    Xs = X
            else:
                Xs = X
                debug["scaled_row"] = None

            # predict
            try:
                pred_raw = model.predict(Xs)[0]
                debug["pred_raw"] = repr(pred_raw)
                # classes
                try:
                    debug["model_classes"] = [str(c) for c in getattr(model, "classes_", [])]
                except Exception:
                    debug["model_classes"] = None
                # proba
                if hasattr(model, "predict_proba"):
                    try:
                        probs = model.predict_proba(Xs)[0].tolist()
                        debug["probs"] = probs
                        debug["proba_max"] = max(probs)
                    except Exception as e:
                        debug["proba_error"] = str(e)
                # decode label
                label = str(pred_raw)
                try:
                    if artifacts.get("label_map"):
                        inv = {v: k for k, v in artifacts["label_map"].items()}
                        label = inv.get(int(pred_raw), str(pred_raw))
                    elif artifacts.get("label_encoder"):
                        label = artifacts["label_encoder"].inverse_transform([int(pred_raw)])[0]
                    elif bundle.get("encoder"):
                        label = bundle["encoder"].inverse_transform([int(pred_raw)])[0]
                except Exception as e:
                    debug["label_decode_error"] = str(e)

                debug["label"] = label
            except Exception as e:
                debug["predict_error"] = str(e)
                debug["predict_tb"] = traceback.format_exc()

            return jsonify(debug)

        elif model_name == "bcc":
            # BCC: we will attempt to build 15-element row from expected keys or values
            BCC_FEATURES = [
                "proto", "src_port", "dst_port", "flow_duration", "total_fwd_pkts",
                "total_bwd_pkts", "flags_numeric", "payload_len", "header_len",
                "rate", "iat", "syn", "ack", "rst", "fin"
            ]
            debug["expected_bcc_features"] = BCC_FEATURES
            if all(k in feats for k in BCC_FEATURES):
                row = [float(feats.get(k, 0.0)) for k in BCC_FEATURES]
            else:
                vals = list(feats.values())
                vals = [float(v) if (v is not None and str(v).strip() != "") else 0.0 for v in vals]
                if len(vals) < 15:
                    vals = vals + [0.0] * (15 - len(vals))
                row = vals[:15]
            debug["raw_row"] = row
            X = np.array([row], dtype=float)

            # try scaler from bundle or artifacts
            scaler = bundle.get("scaler") or artifacts.get("scaler")
            if scaler is not None:
                try:
                    Xs = scaler.transform(X)
                    debug["scaled_row"] = np.array(Xs).tolist()
                except Exception as e:
                    debug["scaler_error"] = str(e)
                    Xs = X
            else:
                Xs = X
                debug["scaled_row"] = None

            try:
                pred_raw = model.predict(Xs)[0]
                debug["pred_raw"] = repr(pred_raw)
                # model raw classes (may be numeric)
                debug["model_classes"] = [str(c) for c in getattr(model, "classes_", [])]
                if hasattr(model, "predict_proba"):
                    try:
                        probs = model.predict_proba(Xs)[0].tolist()
                        debug["probs"] = probs
                        debug["proba_max"] = max(probs)
                    except Exception as e:
                        debug["proba_error"] = str(e)
                # decode using encoder if present (bundle or artifacts)
                label = str(pred_raw)
                try:
                    encoder = bundle.get("encoder") or artifacts.get("label_encoder")
                    if encoder:
                        label = encoder.inverse_transform([int(pred_raw)])[0]
                except Exception as e:
                    debug["label_decode_error"] = str(e)
                debug["label"] = label
            except Exception as e:
                debug["predict_error"] = str(e)
                debug["predict_tb"] = traceback.format_exc()

            return jsonify(debug)

        else:
            return jsonify({"error": "unsupported model"}), 400

    except Exception as e:
        return jsonify({"error": str(e), "tb": traceback.format_exc()}), 500


@manual_predict.route("/retrain_request", methods=["POST"])
def retrain_request():
    data = request.get_json() or {}
    # Save retrain request to a file for later processing
    with open("retrain_requests.jsonl", "a") as f:
        f.write(json.dumps(data) + "\n")

    return jsonify({"status": "saved", "msg": "Retrain request recorded"})
