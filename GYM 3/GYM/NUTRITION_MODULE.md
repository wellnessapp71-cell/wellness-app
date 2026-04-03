# Nutrition Module Technical Overview

## Overview
The Nutrition module provides comprehensive nutrition tracking and calorie management capabilities. It consists of two parts:
1. **Built-in Nutrition Tracker** (`src/nutrition_tracker.py`) - Core nutrition functionality
2. **Nutrition-AI** (`nutrition-ai/`) - Advanced AI-powered nutrition analysis

## Key Components

### 1. Nutrition Tracker (`src/nutrition_tracker.py`)
Tracks calorie intake and provides nutritional analysis integrated with fitness progression.

**Key Classes:**
- `NutritionTracker`: Main nutrition tracking component

**Key Methods:**
- `log_meal()`: Logs meals by description or direct calorie input
- `show_nutrition_summary()`: Displays weekly nutrition summary
- `analyze_calorie_balance()`: Analyzes calorie balance for fitness goals
- `get_weekly_nutrition_summary()`: Gets weekly nutrition data

**Features:**
- Meal logging by description or direct calorie input
- Comprehensive food database with 150+ items
- Calorie estimation from food descriptions
- Weekly calorie tracking (consumed vs. burned)
- Nutrition goal tracking (lose, gain, maintain)
- Integration with level advancement algorithm
- Daily nutrition check-in before workouts

**Food Database Categories:**
- Proteins (chicken, beef, fish, eggs, etc.)
- Dairy (milk, cheese, yogurt, etc.)
- Grains & Bread (rice, pasta, bread, etc.)
- Vegetables (potatoes, carrots, broccoli, etc.)
- Fruits (apples, bananas, berries, etc.)
- Snacks & Sweets (chocolate, chips, etc.)
- Beverages (water, coffee, tea, etc.)

### 2. Nutrition-AI (`nutrition-ai/`)
Advanced nutrition analysis and AI-powered calorie estimation.

**Key Components:**
- AI chatbot for precise calorie values
- Advanced food database with detailed nutritional information
- Meal planning and dietary recommendations
- Integration suggestions for unrecognized foods

**Directories:**
- `api/`: API endpoints for nutrition queries
- `app/`: Core application logic
- `calorie_query/`: Calorie database and estimation
- `chat_assistant/`: AI chatbot implementation
- `cli/`: CLI interface for nutrition AI
- `make_with_what_you_have/`: Recipe suggestions based on available ingredients

## Data Flow

1. **Meal Logging**: User logs meals through description or direct input
2. **Calorie Estimation**: System estimates or records calorie values
3. **Weekly Tracking**: System tracks consumed vs. burned calories
4. **Balance Analysis**: System analyzes nutrition balance for goals
5. **Level Integration**: Nutrition data influences fitness level progression
6. **Progress Reporting**: Analytics generated for user feedback

## Integration Points

- **GYM Module**: Calorie burn data from workout logs
- **YOGA Module**: Calorie burn data from yoga sessions
- **Level Advancement**: Nutrition balance affects progression recommendations
- **Daily Check-in**: Nutrition logging before workout sessions

## APIs for App Integration

```python
# Nutrition Tracking
from src.nutrition_tracker import NutritionTracker
nutrition_tracker = NutritionTracker()

# Log a meal by description
nutrition_tracker.log_meal(user, "2 boiled eggs, 1 slice toast", None)

# Log a meal by direct calories
nutrition_tracker.log_meal(user, None, 300.0)

# Show nutrition summary
nutrition_tracker.show_nutrition_summary(user)

# Analyze calorie balance
analysis = nutrition_tracker.analyze_calorie_balance(user)
```

## Food Database Structure

The built-in food database contains approximately 150 common foods with estimated calorie values:

**Proteins:**
- Chicken breast: 165 calories
- Ground beef: 250 calories
- Salmon: 206 calories
- Eggs: 70 calories
- Tofu: 76 calories

**Grains & Bread:**
- White rice: 205 calories
- Whole wheat bread: 69 calories
- Pasta: 200 calories
- Oatmeal: 150 calories

**Vegetables:**
- Potato: 160 calories
- Broccoli: 34 calories
- Carrot: 25 calories
- Spinach: 23 calories

**Fruits:**
- Apple: 95 calories
- Banana: 105 calories
- Orange: 62 calories

## Calorie Balance Analysis

The system analyzes weekly calorie balance to provide recommendations:

**For Weight Loss:**
- Target: 500 calorie daily deficit
- Weekly target: 3500 calorie deficit

**For Weight Gain:**
- Target: 500 calorie daily surplus
- Weekly target: 3500 calorie surplus

**For Maintenance:**
- Target: Calorie balance within ±500 calories

## Integration with Fitness Modules

### GYM Integration:
- Workout calorie burn added to [weekly_calorie_burned](file:///Users/shankarsingh/Desktop/GYM/src/user_manager.py#L36-L36)
- Nutrition balance affects level progression recommendations

### YOGA Integration:
- Yoga session calorie burn added to [weekly_calorie_burned](file:///Users/shankarsingh/Desktop/GYM/src/user_manager.py#L36-L36)
- Nutrition balance affects practice recommendations

## Daily Nutrition Check-in

Before each workout session, users are prompted to:
1. Log meals consumed that day
2. Set nutrition goals if not already set
3. View nutrition summary
4. Receive feedback on calorie balance

This ensures consistent nutrition tracking and integration with fitness activities.