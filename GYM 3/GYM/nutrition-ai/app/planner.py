import ollama
from app.prompts import build_prompt

def generate_meal_plan(user_data):
    prompt = build_prompt(user_data)
    
    response = ollama.chat(
        model="llama3.1:8b",  # your local LLaMA model
        messages=[{"role": "user", "content": prompt}]
    )

    return response["message"]["content"]