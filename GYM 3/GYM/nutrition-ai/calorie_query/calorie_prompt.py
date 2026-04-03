# calorie_query/calorie_prompt.py

def build_calorie_query_prompt(user_data, calorie_limit):
    return f"""
You are a nutritionist AI.

Based on this user's profile, suggest 2–3 realistic meal options under {calorie_limit} calories. Each dish should:
- Match the user's dietary type and cuisine preference
- Avoid allergens and be suitable for medical conditions
- Support the user's health goal

User Profile:
- Age: {user_data['age']}
- Gender: {user_data['gender']}
- Height: {user_data['height']} cm
- Weight: {user_data['weight']} kg
- Activity Level: {user_data['activity']}
- Diet: {user_data['diet']}
- Preferred Cuisine: {user_data['cuisine']}
- Allergies: {user_data['allergies'] or 'None'}
- Medical Conditions: {user_data['medical_conditions'] or 'None'}
- Health Goal: {user_data['goal']}

🍽️ For each meal, include:
1. Dish name
2. Raw ingredients with quantities
3. Nutritional breakdown (Calories, Protein, Carbs, Fat, Fiber)
4. Tags: diabetic-friendly, gluten-free, etc.

Use Markdown format with clear sections.
""".strip()
