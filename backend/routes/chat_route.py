from flask import Blueprint, request, jsonify
from groq import Groq
import os

chat_bp = Blueprint("chat_bp", __name__)
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

@chat_bp.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        msg = data.get("message", "")

        result = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": msg}]
        )

        reply = result.choices[0].message.content

        return jsonify({"reply": reply})

    except Exception as e:
        print("Chat error:", e)
        return jsonify({"error": str(e)}), 500

