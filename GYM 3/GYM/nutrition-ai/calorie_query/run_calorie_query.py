import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from calorie_query.calorie_prompt import build_calorie_query_prompt
import ollama

def run_cli():
    print("🔍 Calorie-Based Meal Suggestion Tool\n")

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

    calorie_limit = input("Enter calorie limit for meal suggestion (e.g., 300): ")

    print("\n🧠 Generating meal suggestions...\n")

    prompt = build_calorie_query_prompt(user_data, calorie_limit)

    response = ollama.chat(
        model="llama3.1:8b",
        messages=[{"role": "user", "content": prompt}]
    )

    print(response["message"]["content"])

if __name__ == "__main__":
    run_cli()