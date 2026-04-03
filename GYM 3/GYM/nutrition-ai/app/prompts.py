def build_prompt(user_data):
    dislikes = user_data.get("dislikes", [])
    dislikes_str = ", ".join(dislikes) if dislikes else "None"

    return f"""
You are a nutritionist AI. Based on the following user details, generate a **1-day personalized meal plan** with Breakfast, Lunch, Snack, and Dinner.

Return:
1. Dish name
2. Raw ingredients with quantity (approximate weights)
3. Macronutrient & micronutrient breakdown (calories, protein, carbs, fat, fiber, iron, B12, calcium, potassium, omega-3)
4. Daily totals
5. Health notes (diabetic, allergy, weight goal, etc.)

❌ Avoid any ingredients or dishes that include: {dislikes_str}

User Profile:
- Age: {user_data['age']}
- Gender: {user_data['gender']}
- Height: {user_data['height']} cm
- Weight: {user_data['weight']} kg
- Activity Level: {user_data['activity']}
- Diet Type: {user_data['diet']}
- Cuisine Preference: {user_data['cuisine']}
- Allergies: {user_data['allergies'] or 'None'}
- Medical Conditions: {user_data['medical_conditions'] or 'None'}
- Health Goal: {user_data['goal']}

📝 Format:
Use clean Markdown with:
- `##` for each meal
- Bullet points for ingredients & nutrients
- Section at the end for totals + flags

Example:
## 🍽️ Breakfast: <Dish Name>
**🧾 Ingredients:**
- Item (weight g)
...

**🔍 Nutrition:**
- Calories: ___ kcal
- Protein: ___ g
...

## 🎯 Daily Totals
...

✅ **Flags:** diabetic-friendly, lactose-free, etc.
""".strip()