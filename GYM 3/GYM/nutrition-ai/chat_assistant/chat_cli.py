# chat_assistant/chat_cli.py

import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import ollama
from chat_assistant.chat_prompt import build_chat_prompt

def main():
    print("👋 Welcome to Nutrition Chat Assistant (Phase 5)")

    user_data = {
        "age": input("Enter your age: "),
        "gender": input("Gender (M/F): "),
        "height": input("Height (cm): "),
        "weight": input("Weight (kg): "),
        "activity": input("Activity level (sedentary/light/moderate/active): "),
        "diet": input("Diet (veg/vegan/non-veg/Jain): "),
        "cuisine": input("Cuisine preference (South Indian/North Indian/Chinese/Keto/etc.): "),
        "allergies": input("Any allergies (comma-separated or leave blank): "),
        "medical_conditions": input("Medical conditions (comma-separated or leave blank): "),
        "goal": input("Health goal (weight loss/gain/maintenance/muscle gain): ")
    }

    question = input("\n❓ Enter your nutrition question: ")

    print("\n🤖 Thinking...\n")

    prompt = build_chat_prompt(user_data, question)

    try:
        response = ollama.chat(
            model="llama3:8b",
            messages=[{"role": "user", "content": prompt}]
        )
        print(response["message"]["content"])
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
