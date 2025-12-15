import os
import requests

API_KEY = os.getenv("GROQ_API_KEY")
if not API_KEY:
    raise RuntimeError("Set env GROQ_API_KEY")

resp = requests.get(
    "https://api.groq.com/v1/models",
    headers={"Authorization": f"Bearer {API_KEY}"}
)
print("Status:", resp.status_code)
print("Response:", resp.text)
