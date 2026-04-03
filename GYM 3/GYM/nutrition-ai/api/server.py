import sys
import os
from flask import Flask, request, jsonify

# Ensure parent directory is in sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.planner import generate_meal_plan
from calorie_query.calorie_prompt import build_calorie_query_prompt
from make_with_what_you_have.match_prompt import build_ingredient_prompt
from chat_assistant.chat_prompt import build_chat_prompt
from flask import Flask, request, jsonify
import ollama

app = Flask(__name__)

@app.route("/generate", methods=["POST"])
def generate():
    user_data = request.json

    # Normalize dislikes into a list
    dislikes = user_data.get("dislikes", "")
    if isinstance(dislikes, str):
        user_data["dislikes"] = [item.strip().lower() for item in dislikes.split(",") if item.strip()]
    elif isinstance(dislikes, list):
        user_data["dislikes"] = [item.strip().lower() for item in dislikes]
    else:
        user_data["dislikes"] = []

    try:
        result = generate_meal_plan(user_data)
        return jsonify({"success": True, "meal_plan": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    
@app.route("/query", methods=["POST"])
def calorie_query():
    user_data = request.json.get("user_data")
    calorie_limit = request.json.get("calorie_limit")

    if not user_data or not calorie_limit:
        return jsonify({"success": False, "error": "Missing user_data or calorie_limit"}), 400

    try:
        prompt = build_calorie_query_prompt(user_data, calorie_limit)
        response = ollama.chat(
            model="llama3:8b",
            messages=[{"role": "user", "content": prompt}]
        )
        return jsonify({
            "success": True,
            "suggestions": response["message"]["content"]
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/suggest", methods=["POST"])
def suggest_meals():
    user_data = request.json.get("user_data")
    ingredients = request.json.get("ingredients")

    if not user_data or not ingredients:
        return jsonify({"success": False, "error": "Missing user_data or ingredients"}), 400

    try:
        prompt = build_ingredient_prompt(user_data, ingredients)
        response = ollama.chat(
            model="llama3:8b",
            messages=[{"role": "user", "content": prompt}]
        )
        return jsonify({
            "success": True,
            "suggestions": response["message"]["content"]
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/chat", methods=["POST"])
def chat_with_ai():
    data = request.json
    user_data = data.get("user_data")
    user_question = data.get("question")

    if not user_data or not user_question:
        return jsonify({"success": False, "error": "Missing user_data or question"}), 400

    prompt = build_chat_prompt(user_data, user_question)

    try:
        response = ollama.chat(
            model="llama3:8b",
            messages=[{"role": "user", "content": prompt}]
        )
        return jsonify({"success": True, "answer": response["message"]["content"]})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
