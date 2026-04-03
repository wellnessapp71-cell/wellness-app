"""
Nutrition Tracking Module
Handles calorie intake tracking and balance analysis for fitness progression
"""

import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from rich.console import Console
from rich.prompt import Prompt, Confirm, FloatPrompt
from rich.panel import Panel
from rich.table import Table
from rich.text import Text

from src.user_manager import User, UserManager

console = Console()

class NutritionTracker:
    """Manages nutrition tracking and calorie balance analysis"""
    
    def __init__(self, data_file: str = "data/nutrition_logs.json"):
        self.data_file = data_file
        self.nutrition_logs: Dict[str, List[Dict]] = {}  # user_id -> list of nutrition logs
        self._ensure_data_directory()
        self._load_nutrition_logs()
    
    def _ensure_data_directory(self):
        """Ensure data directory exists"""
        os.makedirs(os.path.dirname(self.data_file), exist_ok=True)
    
    def _load_nutrition_logs(self):
        """Load nutrition logs from JSON file"""
        if os.path.exists(self.data_file):
            try:
                with open(self.data_file, 'r') as f:
                    data = json.load(f)
                    for user_id, logs in data.items():
                        self.nutrition_logs[user_id] = logs
            except Exception as e:
                console.print(f"⚠️  Warning: Could not load nutrition logs: {e}", style="yellow")
                self.nutrition_logs = {}
    
    def _save_nutrition_logs(self):
        """Save nutrition logs to JSON file"""
        try:
            # Ensure directory exists
            os.makedirs(os.path.dirname(self.data_file), exist_ok=True)
            
            with open(self.data_file, 'w') as f:
                json.dump(self.nutrition_logs, f, indent=2, default=str)
        except Exception as e:
            console.print(f"❌ Error saving nutrition logs: {e}", style="red")
    
    def log_meal(self, user: User, meal_description: Optional[str] = None, calories: Optional[float] = None) -> Dict:
        """Log a meal with either description or direct calorie input"""
        if not meal_description and calories is None:
            # Interactive mode - ask user for input
            console.print("\n🍽️  Meal Logging", style="bold blue")
            console.print("You can either:")
            console.print("1. Describe what you ate (we'll estimate calories)")
            console.print("2. Enter calories directly")
            
            choice = Prompt.ask("Choose option", choices=["1", "2"], default="2")
            
            if choice == "1":
                meal_description = Prompt.ask("Describe what you ate (e.g., '2 boiled eggs, 1 slice toast')")
                # In a real implementation, this would connect to a nutrition API
                # For now, we'll estimate based on common foods
                calories = self._estimate_calories(meal_description)
                console.print(f"Estimated calories: {calories:.0f}", style="green")
            else:
                calories = FloatPrompt.ask("Enter calories consumed")
                meal_description = f"Direct input: {calories:.0f} calories"
        
        # Ensure calories is a float
        if calories is None:
            calories = 0.0
        
        # Create log entry
        log_entry = {
            "date": datetime.now().isoformat(),
            "meal_description": meal_description or "",
            "calories": float(calories),
            "user_id": user.id
        }
        
        # Add to user's logs
        if user.id not in self.nutrition_logs:
            self.nutrition_logs[user.id] = []
        
        self.nutrition_logs[user.id].append(log_entry)
        self._save_nutrition_logs()
        
        # Update user's weekly intake
        user.weekly_calorie_intake += float(calories)
        
        console.print(f"✅ Logged {calories:.0f} calories: {meal_description}", style="green")
        return log_entry
    
    def _estimate_calories(self, description: str) -> float:
        """Estimate calories based on meal description (simplified)"""
        # This is a very simplified estimation
        # In a real implementation, this would connect to a nutrition database
        from rich.console import Console
        console = Console()
        
        description = description.lower()
        
        # Comprehensive food database with approximate calories
        calorie_map = {
            # Proteins
            "chicken": 165,
            "chicken breast": 165,
            "chicken thigh": 209,
            "chicken wing": 203,
            "turkey": 135,
            "beef": 250,
            "ground beef": 250,
            "steak": 271,
            "pork": 217,
            "bacon": 541,
            "ham": 139,
            "salmon": 206,
            "tuna": 132,
            "fish": 120,
            "cod": 82,
            "shrimp": 99,
            "crab": 83,
            "lobster": 89,
            "egg": 70,
            "eggs": 70,
            "boiled egg": 70,
            "fried egg": 90,
            "scrambled egg": 91,
            "omelette": 94,
            "tofu": 76,
            "paneer": 265,
            "cheese": 110,
            "cottage cheese": 98,
            "yogurt": 100,
            "greek yogurt": 130,
            
            # Dairy
            "milk": 150,
            "whole milk": 150,
            "skim milk": 83,
            "cream": 520,
            "butter": 717,
            "ice cream": 140,
            
            # Grains & Bread
            "bread": 80,
            "toast": 80,
            "white bread": 79,
            "whole wheat bread": 69,
            "bagel": 289,
            "english muffin": 127,
            "croissant": 231,
            "rice": 200,
            "white rice": 205,
            "brown rice": 216,
            "basmati rice": 194,
            "pasta": 200,
            "spaghetti": 221,
            "macaroni": 221,
            "noodles": 138,
            "oatmeal": 150,
            "oats": 150,
            "quinoa": 222,
            "couscous": 112,
            "bulgur": 151,
            
            # Vegetables
            "potato": 160,
            "sweet potato": 180,
            "carrot": 25,
            "broccoli": 34,
            "cauliflower": 25,
            "spinach": 23,
            "kale": 33,
            "lettuce": 5,
            "cucumber": 16,
            "tomato": 22,
            "bell pepper": 31,
            "onion": 44,
            "garlic": 149,
            "corn": 132,
            "peas": 118,
            "beans": 132,
            "kidney beans": 127,
            "black beans": 132,
            "lentils": 230,
            "avocado": 234,
            "salad": 50,
            "mixed vegetables": 50,
            "vegetable": 25,
            "vegetables": 25,
            
            # Fruits
            "apple": 95,
            "banana": 105,
            "orange": 62,
            "grapefruit": 52,
            "lemon": 17,
            "lime": 20,
            "berries": 84,
            "strawberries": 49,
            "blueberries": 84,
            "grapes": 104,
            "watermelon": 86,
            "pineapple": 82,
            "mango": 202,
            "kiwi": 112,
            "peach": 59,
            "pear": 101,
            "fruit": 80,
            
            # Nuts & Seeds
            "almonds": 164,
            "walnuts": 185,
            "pecans": 196,
            "peanuts": 161,
            "cashews": 157,
            "pistachios": 159,
            "sunflower seeds": 180,
            "chia seeds": 177,
            "flax seeds": 152,
            "nuts": 160,
            
            # Oils & Fats
            "olive oil": 884,
            "coconut oil": 884,
            "vegetable oil": 884,
            "butter": 717,
            "margarine": 717,
            
            # Snacks & Sweets
            "chocolate": 50,
            "dark chocolate": 170,
            "milk chocolate": 150,
            "cookie": 75,
            "cookies": 75,
            "cake": 350,
            "cupcake": 294,
            "brownie": 225,
            "pie": 300,
            "ice cream": 140,
            "candy": 24,
            "chips": 152,
            "popcorn": 31,
            "pretzels": 108,
            "crackers": 120,
            
            # Beverages
            "water": 0,
            "coffee": 5,
            "tea": 2,
            "green tea": 2,
            "soda": 140,
            "cola": 140,
            "juice": 110,
            "orange juice": 112,
            "apple juice": 114,
            "wine": 125,
            "beer": 153,
            "smoothie": 200,
            
            # Prepared Foods
            "sandwich": 300,
            "hamburger": 500,
            "cheeseburger": 550,
            "burger": 500,
            "hot dog": 290,
            "pizza": 285,
            "slice of pizza": 285,
            "fried chicken": 350,
            "fried fish": 250,
            "sushi": 45,
            "ramen": 220,
            "soup": 100,
            "salad": 50,
            "caesar salad": 481,
            "protein shake": 150,
            "shake": 150,
            "protein bar": 200,
            
            # Indian Foods
            "dal": 150,
            "lentils": 230,
            "roti": 100,
            "chapati": 100,
            "naan": 262,
            "paratha": 260,
            "dosa": 160,
            "idli": 35,
            "samosa": 262,
            "pakora": 300,
            "biryani": 350,
            "pulao": 250,
            "curry": 150,
            "paneer": 265,
            "aloo gobi": 120,
            "chana masala": 220,
            "palak paneer": 290,
            "butter chicken": 240,
            "tandoori chicken": 165,
            
            # Modifiers (quantity indicators, cooking methods)
            "boiled": 0,
            "fried": 0,
            "grilled": 0,
            "baked": 0,
            "roasted": 0,
            "steamed": 0,
            "raw": 0,
            "cooked": 0,
            "large": 0,
            "small": 0,
            "medium": 0,
            "cup": 0,
            "bowl": 0,
            "plate": 0,
            "serving": 0
        }
        
        total_calories = 0
        words = description.split()
        matched_foods = []  # Track what foods were matched
        
        # Look for quantities and foods
        i = 0
        while i < len(words):
            word = words[i]
            # Check for numbers
            if word.isdigit():
                quantity = int(word)
                i += 1
                if i < len(words):
                    food = words[i]
                    # Try to find the most specific match first
                    food_phrase = f"{words[i-1]} {food}" if i > 1 else food
                    base_calories = calorie_map.get(food_phrase, calorie_map.get(food, 0))
                    if base_calories > 0:
                        total_calories += quantity * base_calories
                        matched_foods.append(f"{quantity} x {food} ({base_calories} cal each)")
            else:
                # Check if word or phrase is a food item
                # Try 2-word phrases first
                if i < len(words) - 1:
                    phrase = f"{word} {words[i+1]}"
                    base_calories = calorie_map.get(phrase, 0)
                    if base_calories > 0:
                        total_calories += base_calories
                        matched_foods.append(f"{phrase} ({base_calories} cal)")
                        i += 2
                        continue
                
                # Try single word
                base_calories = calorie_map.get(word, 0)
                if base_calories > 0:
                    total_calories += base_calories
                    matched_foods.append(f"{word} ({base_calories} cal)")
                i += 1
        
        # If no matches found, provide a reasonable default
        if total_calories == 0:
            # Estimate based on description length
            total_calories = max(100, len(description) * 10)
        
        # If some words were recognized but others weren't, inform user about unrecognized items
        if matched_foods and len(words) > len(matched_foods):
            unrecognized = [word for word in words if word not in calorie_map and not word.isdigit()]
            if unrecognized:
                console.print(f"⚠️  Note: Could not recognize '{', '.join(unrecognized)}' in your description", style="yellow")
                console.print("💡 Tip: For better accuracy, you can:", style="blue")
                console.print("   1. Enter calories directly for this meal", style="blue")
                console.print("   2. Use more specific food descriptions", style="blue")
                console.print("   3. Consult the nutrition-ai module for precise values", style="blue")
        
        return float(total_calories)
    
    def get_weekly_nutrition_summary(self, user: User) -> Dict:
        """Get weekly nutrition summary for a user"""
        if user.id not in self.nutrition_logs:
            return {
                "total_calories_consumed": 0,
                "total_calories_burned": user.weekly_calorie_burned,
                "net_calorie_balance": -user.weekly_calorie_burned,
                "entries": []
            }
        
        # Filter logs for current week
        current_week_logs = []
        today = datetime.now()
        week_start = today - timedelta(days=today.weekday())
        
        for log in self.nutrition_logs[user.id]:
            log_date = datetime.fromisoformat(log["date"])
            if log_date.date() >= week_start.date():
                current_week_logs.append(log)
        
        total_calories_consumed = sum(log["calories"] for log in current_week_logs)
        
        return {
            "total_calories_consumed": total_calories_consumed,
            "total_calories_burned": user.weekly_calorie_burned,
            "net_calorie_balance": total_calories_consumed - user.weekly_calorie_burned,
            "entries": current_week_logs
        }
    
    def analyze_calorie_balance(self, user: User) -> Dict:
        """Analyze calorie balance and provide recommendations"""
        summary = self.get_weekly_nutrition_summary(user)
        consumed = summary["total_calories_consumed"]
        burned = summary["total_calories_burned"]
        balance = summary["net_calorie_balance"]
        
        # Calculate recommended calorie intake based on user goals
        bmr = self._calculate_bmr(user)
        recommended_intake = self._calculate_recommended_intake(bmr, user.nutrition_goal)
        
        # Determine if user is on track
        if user.nutrition_goal == "lose":
            target_balance = -500  # 500 calorie deficit per day for weight loss
            weekly_target = target_balance * 7
            on_track = balance <= weekly_target * 1.1  # 10% buffer
        elif user.nutrition_goal == "gain":
            target_balance = 500  # 500 calorie surplus per day for weight gain
            weekly_target = target_balance * 7
            on_track = balance >= weekly_target * 0.9  # 10% buffer
        else:  # maintain
            target_balance = 0
            weekly_target = 0
            on_track = abs(balance) <= 500  # Within 500 calories
        
        return {
            "consumed": consumed,
            "burned": burned,
            "balance": balance,
            "recommended_intake": recommended_intake,
            "weekly_target": weekly_target,
            "on_track": on_track,
            "recommendation": self._generate_recommendation(balance, user.nutrition_goal, consumed, burned)
        }
    
    def _calculate_bmr(self, user: User) -> float:
        """Calculate Basal Metabolic Rate using Mifflin-St Jeor Equation"""
        if user.gender.lower() == "male":
            bmr = 10 * user.current_weight + 6.25 * 170 - 5 * user.age + 5  # Assuming 170cm height
        else:
            bmr = 10 * user.current_weight + 6.25 * 170 - 5 * user.age - 161  # Assuming 170cm height
        return bmr
    
    def _calculate_recommended_intake(self, bmr: float, goal: str) -> float:
        """Calculate recommended daily calorie intake based on activity level and goal"""
        # Assume moderate activity level (1.55 multiplier)
        daily_needs = bmr * 1.55
        
        if goal == "lose":
            return daily_needs - 500  # 500 calorie deficit
        elif goal == "gain":
            return daily_needs + 500  # 500 calorie surplus
        else:  # maintain
            return daily_needs
    
    def _generate_recommendation(self, balance: float, goal: str, consumed: float, burned: float) -> str:
        """Generate personalized recommendation based on calorie balance"""
        if goal == "lose":
            if balance < -3500:  # More than 500 daily deficit
                return "Great job! You're in a healthy calorie deficit for weight loss."
            elif balance > -2500:  # Less than 350 daily deficit
                return "Try to reduce calorie intake slightly to reach your weight loss goal."
            else:
                return "You're on track with your weight loss plan!"
        elif goal == "gain":
            if balance > 3500:  # More than 500 daily surplus
                return "Great job! You're in a healthy calorie surplus for weight gain."
            elif balance < 2500:  # Less than 350 daily surplus
                return "Try to increase calorie intake slightly to reach your weight gain goal."
            else:
                return "You're on track with your weight gain plan!"
        else:  # maintain
            if abs(balance) < 1000:  # Within 1000 calories
                return "Perfect! Your calorie intake matches your expenditure."
            elif balance > 1000:
                return "You're consuming more calories than you're burning. Consider reducing intake."
            else:
                return "You're burning more calories than you're consuming. Consider increasing intake."
    
    def show_nutrition_summary(self, user: User):
        """Display nutrition summary for the user"""
        summary = self.get_weekly_nutrition_summary(user)
        analysis = self.analyze_calorie_balance(user)
        
        console.print("\n" + "="*50)
        console.print("🍽️  NUTRITION SUMMARY", style="bold blue")
        console.print("="*50)
        
        # Summary panel
        summary_text = Text()
        summary_text.append(f"Calories Consumed: ", style="bold")
        summary_text.append(f"{summary['total_calories_consumed']:.0f}\n", style="green")
        summary_text.append(f"Calories Burned: ", style="bold")
        summary_text.append(f"{summary['total_calories_burned']:.0f}\n", style="red")
        summary_text.append(f"Net Balance: ", style="bold")
        balance_style = "green" if summary['net_calorie_balance'] >= 0 else "red"
        summary_text.append(f"{summary['net_calorie_balance']:.0f}\n", style=balance_style)
        
        console.print(Panel(summary_text, title="Weekly Summary", border_style="blue"))
        
        # Analysis panel
        analysis_text = Text()
        analysis_text.append(f"Status: ", style="bold")
        status_style = "green" if analysis['on_track'] else "yellow"
        status_text = "ON TRACK" if analysis['on_track'] else "ADJUST NEEDED"
        analysis_text.append(f"{status_text}\n", style=status_style)
        analysis_text.append(f"Recommendation: ", style="bold")
        analysis_text.append(f"{analysis['recommendation']}\n")
        
        console.print(Panel(analysis_text, title="Analysis", border_style="blue"))
        
        # Recent meals
        if summary['entries']:
            console.print("\n📅 Recent Meals:")
            table = Table(show_header=True, header_style="bold magenta")
            table.add_column("Date", style="cyan")
            table.add_column("Meal", style="white")
            table.add_column("Calories", justify="right", style="green")
            
            # Show last 5 meals
            for log in summary['entries'][-5:]:
                log_date = datetime.fromisoformat(log["date"]).strftime('%m/%d %H:%M')
                table.add_row(log_date, log["meal_description"], f"{log['calories']:.0f}")
            
            console.print(table)
        else:
            console.print("📝 No meals logged this week.", style="yellow")
    
    def reset_weekly_counters(self, user: User):
        """Reset weekly counters and save history"""
        if user.weekly_calorie_intake > 0 or user.weekly_calorie_burned > 0:
            # Save current week's data to history
            week_data = {
                "week_start": (datetime.now() - timedelta(days=datetime.now().weekday())).isoformat(),
                "calories_consumed": user.weekly_calorie_intake,
                "calories_burned": user.weekly_calorie_burned,
                "net_balance": user.weekly_calorie_intake - user.weekly_calorie_burned
            }
            
            user.calorie_balance_history.append(week_data)
            
            # Keep only last 12 weeks of history
            if len(user.calorie_balance_history) > 12:
                user.calorie_balance_history = user.calorie_balance_history[-12:]
        
        # Reset weekly counters
        user.weekly_calorie_intake = 0.0
        user.weekly_calorie_burned = 0.0