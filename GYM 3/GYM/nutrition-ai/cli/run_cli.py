import sys
import os
from flask import Flask, request, jsonify

# Ensure parent directory is in sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.planner import generate_meal_plan

def main():
    print("👋 Welcome to your Personal Nutrition Assistant!\n")

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
        "goal": input("Health goal (weight loss/gain/maintenance/muscle gain): "),
        "dislikes": input("Any foods or dishes you dislike? (comma-separated or leave blank): ")
    }

    # Process dislikes into a list
    if user_data["dislikes"]:
        user_data["dislikes"] = [item.strip().lower() for item in user_data["dislikes"].split(",")]
    else:
        user_data["dislikes"] = []

    print("\n📊 Generating your personalized meal plan...\n")
    meal_plan = generate_meal_plan(user_data)
    print(meal_plan)

if __name__ == "__main__":
    main()