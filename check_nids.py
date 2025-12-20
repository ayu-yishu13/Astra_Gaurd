import requests

# Replace with your actual Space URL (remove the / at the end)
SPACE_URL = "https://codebaseai-ai-nids-backend.hf.space"

def run_health_check():
    print(f"🔍 Starting Health Check for: {SPACE_URL}")
    print("-" * 50)
    
    routes_to_test = [
        "/api/logs/status",
        "/api/model/active",
        "/api/live",
        "/api/predict",
        "/api/reports"
    ]
    
    print(f"🚀 Testing {len(routes_to_test)} endpoints...")
    
    for route in routes_to_test:
        full_url = f"{SPACE_URL}{route}"
        try:
            # Note: Some routes might need POST, but GET is a good start to check existence
            response = requests.get(full_url, timeout=5)
            status_icon = "✅" if response.status_code < 400 else "❌"
            print(f"{status_icon} {response.status_code} - {route}")
        except Exception as e:
            print(f"⚠️ Error reaching {route}: {e}")

    # 1. Test Root / System Info
    try:
        # Most of your routes are under /api
        res = requests.get(f"{SPACE_URL}/api") 
        if res.status_code == 200:
            print("✅ API Root: ONLINE")
            print(f"   Response: {res.json().get('status', 'No status field')}")
        else:
            print(f"❌ API Root: FAILED (Status: {res.status_code})")
    except Exception as e:
        print(f"❌ API Root: UNREACHABLE ({e})")

    # 2. Test Log Status
    try:
        res = requests.get(f"{SPACE_URL}/api/logs/status?model=bcc")
        if res.status_code == 200:
            print("✅ Log System: OPERATIONAL")
            print(f"   BCC Stats: {res.json().get('by_class', {})}")
        else:
            print(f"❌ Log System: ERROR ({res.status_code})")
    except Exception as e:
        print(f"❌ Log System: FAILED ({e})")

    # 3. Test Model Switch (Check if logic works)
    try:
        res = requests.get(f"{SPACE_URL}/api/model/active")
        if res.status_code == 200:
            print(f"✅ Active Model: {res.json().get('active_model', 'unknown')}")
        else:
            print(f"⚠️ Model API: Non-standard response ({res.status_code})")
    except Exception as e:
        print(f"❌ Model API: FAILED ({e})")

if __name__ == "__main__":
    run_health_check()