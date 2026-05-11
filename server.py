from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from pypdf import PdfReader
from pymongo import MongoClient
import bcrypt
import jwt
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

import os
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

mongo_client = MongoClient(os.getenv("MONGO_URI"))

db = mongo_client["aichatbotdb"]

users_collection = db["users"]
chats_collection = db["chats"]
JWT_SECRET = os.getenv("JWT_SECRET")


chat = client.chats.create(
    model="gemini-1.5-flash"
)

@app.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if users_collection.find_one({"email": email}):
        return jsonify({"message": "User already exists"}), 400

    hashed_password = bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    )

    users_collection.insert_one({
        "name": name,
        "email": email,
        "password": hashed_password.decode("utf-8")
    })

    return jsonify({
        "message": "Signup successful"
    })

@app.route("/login", methods=["POST"])
def login():

    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    user = users_collection.find_one({
        "email": email
    })

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    password_match = bcrypt.checkpw(
        password.encode("utf-8"),
        user["password"].encode("utf-8")
    )

    if not password_match:
        return jsonify({
            "message": "Invalid password"
        }), 401

    token = jwt.encode(
        {
            "user_id": str(user["_id"]),
            "exp": datetime.utcnow() + timedelta(days=7)
        },
        JWT_SECRET,
        algorithm="HS256"
    )

    return jsonify({
        "message": "Login successful",
        "token": token,
        "name": user["name"]
    })

@app.route("/save-chat", methods=["POST"])
def save_chat():

    data = request.get_json()

    email = data.get("email")

    messages = data.get("messages")

    chats_collection.insert_one({
        "email": email,
        "messages": messages
    })

    return jsonify({
        "message": "Chat saved successfully"
    })

@app.route("/chat", methods=["POST"])
def chat_api():
    try:
        data = request.get_json()
        user_message = data["message"]

        response = chat.send_message(user_message)

        return jsonify({
            "reply": response.text
        })

    except Exception as e:
        print("Gemini Error:", e)

        return jsonify({
            "reply": "Gemini free quota finished for now 😭 Please try again later or use a new API key."
        }), 429

@app.route("/pdf-chat", methods=["POST"])
def pdf_chat():

    pdf_file = request.files["pdf"]

    question = request.form["question"]

    reader = PdfReader(pdf_file)

    pdf_text = ""

    for page in reader.pages:
        pdf_text += page.extract_text()

    prompt = f"""
    Answer the question using this PDF content.

    PDF Content:
    {pdf_text}

    Question:
    {question}
    """

    response = chat.send_message(prompt)

    return jsonify({
        "reply": response.text
    })


if __name__ == "__main__":
    app.run(debug=True)