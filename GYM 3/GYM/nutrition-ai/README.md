# 🧪 Nutrition-AI Testing Guide (CLI + API)

This guide provides detailed instructions and examples to test all **4 phases** of the Nutrition-AI project using both CLI and API versions.

---

## 🏗️ Phase 1: Core Meal Plan Generator with Substitution Engine

### ✅ CLI Test
```bash
$ python cli/run_cli.py

👋 Welcome to your Personal Nutrition Assistant!

Enter your age: 32
Gender (M/F): M
Height (cm): 170
Weight (kg): 62
Activity level (sedentary/light/moderate/active): light
Diet (veg/vegan/non-veg/Jain): veg
Cuisine preference (South Indian/North Indian/Chinese/Keto/etc.): North Indian
Any allergies (comma-separated or leave blank): 
Medical conditions (comma-separated or leave blank): 
Health goal (weight loss/gain/maintenance/muscle gain): gain
Any foods or dishes you dislike? (comma-separated or leave blank): 

📊 Generating your personalized meal plan...
```

### ✅ API Test
```bash
curl -X POST http://localhost:5001/generate \
-H "Content-Type: application/json" \
-d '{
  "age": 25,
  "gender": "F",
  "height": 160,
  "weight": 55,
  "activity": "light",
  "diet": "veg",
  "cuisine": "South Indian",
  "allergies": "",
  "medical_conditions": "",
  "goal": "maintenance",
  "dislikes": "oats, upma"
}' | jq -r '.meal_plan'
```

---

## 📏 Phase 2: Calorie-Based Query ("What can I eat with 300 calories?")

### ✅ CLI Test
```bash
$ python3 calorie_query/run_calorie_query.py

🔍 Calorie-Based Meal Suggestion Tool

Enter your age: 32
Gender (M/F): M
Height (cm): 170
Weight (kg): 62
Activity level (sedentary/light/moderate/active): light
Diet (veg/vegan/non-veg/Jain): vegan
Cuisine preference (South Indian/North Indian/Chinese/Keto/etc.): keto  
Any allergies (comma-separated or leave blank): 
Medical conditions (comma-separated or leave blank): 
Health goal (weight loss/gain/maintenance/muscle gain): gain
Enter calorie limit for meal suggestion (e.g., 300): 400

🧠 Generating meal suggestions...
```

### ✅ API Test
```bash
curl -X POST http://localhost:5001/query \
-H "Content-Type: application/json" \
-d '{
  "user_data": {
    "age": 30,
    "gender": "F",
    "height": 160,
    "weight": 65,
    "activity": "light",
    "diet": "veg",
    "cuisine": "South Indian",
    "allergies": "",
    "medical_conditions": "diabetes",
    "goal": "weight loss"
  },
  "calorie_limit": 300
}' | jq -r '.result'
```

---

## 🧂 Phase 3: Make With What You Have

### ✅ CLI Test
```bash
$ python3 make_with_what_you_have/run_make_with.py

🍲 Make with What You Have Tool

Enter your age: 23
Gender (M/F): F
Height (cm): 162
Weight (kg): 50
Activity level (sedentary/light/moderate/active): moderate
Diet (veg/vegan/non-veg/Jain): non-veg
Cuisine preference (South Indian/North Indian/Chinese/Keto/etc.): North Indian
Any allergies (comma-separated or leave blank): 
Medical conditions (comma-separated or leave blank): 
Health goal (weight loss/gain/maintenance/muscle gain): maintenance
Enter available ingredients (comma-separated): tomato, moong dal, curry leaves, onion, mustard seeds

🔍 Finding recipes based on your ingredients...
```

### ✅ API Test
```bash
curl -X POST http://localhost:5001/suggest \
-H "Content-Type: application/json" \
-d '{
  "user_data": {
    "age": 26,
    "gender": "F",
    "height": 160,
    "weight": 58,
    "activity": "light",
    "diet": "veg",
    "cuisine": "South Indian",
    "allergies": "gluten",
    "medical_conditions": "thyroid",
    "goal": "maintenance"
  },
  "ingredients": "tomato, moong dal, curry leaves, onion, mustard seeds"
}' | jq -r '.result'
```

---

## 🧠 Phase 4: Chat Assistant (LLM Nutrition Q&A)

### ✅ CLI Test
```bash
$ python3 chat_assistant/chat_cli.py

👋 Welcome to Nutrition Chat Assistant (Phase 5)
Enter your age: 24
Gender (M/F): M
Height (cm): 172
Weight (kg): 65
Activity level (sedentary/light/moderate/active): light
Diet (veg/vegan/non-veg/Jain): non-veg
Cuisine preference (South Indian/North Indian/Chinese/Keto/etc.): keto
Any allergies (comma-separated or leave blank): 
Medical conditions (comma-separated or leave blank): 
Health goal (weight loss/gain/maintenance/muscle gain): maintenance

❓ Enter your nutrition question: Can I eat mango if I have diabetes?

🤖 Thinking...
```

### ✅ API Test
```bash
curl -X POST http://localhost:5001/chat \
-H "Content-Type: application/json" \
-d '{
  "user_data": {
    "age": 30,
    "gender": "F",
    "height": 160,
    "weight": 65,
    "activity": "light",
    "diet": "veg",
    "cuisine": "South Indian",
    "allergies": "",
    "medical_conditions": "diabetes",
    "goal": "weight loss"
  },
  "question": "Can I eat mango if I have diabetes?"
}' | jq -r '.result'
```

---

## 📦 Directory Summary

```
NUTRITION-AI/
│
├── api/
│   ├── server.py                         # Central Flask server (routes & endpoints)
│   └── __pycache__/
│
├── app/                                  # Phase 1: Core Meal Plan Generation
│   ├── __init__.py
│   ├── planner.py                        # Meal plan generation logic
│   └── prompts.py                        # Prompt builder for meal planning
│
├── calorie_query/                        # Phase 3: Calorie-Based Dish Suggestions
│   ├── run_calorie_query.py              # CLI tool
│   ├── calorie_prompt.py                 # Calorie-specific prompt logic
│   └── __pycache__/
│
├── chat_assistant/                       # Phase 5: Natural Language Chat Assistant
│   ├── chat_cli.py                       # CLI interaction for chat
│   ├── chat_prompt.py                    # Prompt builder for chat assistant
│   └── __pycache__/
│
├── cli/
│   ├── run_cli.py                        # CLI entry point (Phase 1)
│   └── __pycache__/
│
├── make_with__what_you_have/            # Phase 4: “Make with what you have”
│   ├── run_make_with.py                  # CLI entry for this phase
│   ├── match_prompt.py                   # Prompt builder for ingredient-matching
│   └── __pycache__/
│
├── requirements.txt                      # Python dependencies
├── README.md                             # Docs: How to use all phases (CLI + API)
└── .ropeproject/                         # (VSCode/PyCharm) project metadata
```

---

## ✅ Notes
- Use `jq` to pretty print the JSON output in terminal
- Copy `.md` output files to save meal plans
- Flask server must be running (`python3 api/server.py`) before sending curl requests

---

You're now fully equipped to test every phase of the project, either manually or programmatically.
