#!/usr/bin/env python3
"""
Gym AI CLI - Intelligent Fitness Assistant
A comprehensive CLI application for personalized workout planning and tracking.
"""

import click
from rich.console import Console
from rich.panel import Panel
from rich.text import Text
from rich.prompt import Prompt, Confirm
import sys
import os
import json
from datetime import datetime

# Add the current directory to Python path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.user_manager import UserManager
from src.workout_planner import WorkoutPlanner
from src.fitness_assessor import FitnessAssessor
from src.progress_tracker import ProgressTracker

console = Console()

class GymAICLI:
    def __init__(self):
        self.user_manager = UserManager()
        self.workout_planner = WorkoutPlanner()
        self.fitness_assessor = FitnessAssessor()
        self.progress_tracker = ProgressTracker()
        self.current_user = None
        # Check if running in a terminal that supports advanced features
        self.terminal_width = console.size.width if hasattr(console, 'size') else 80
        self.is_wide_terminal = self.terminal_width >= 100

    def display_welcome(self):
        """Display welcome message and main menu"""
        welcome_text = Text()
        welcome_text.append("🏋️  GYM AI CLI - Your Intelligent Fitness Assistant\n", style="bold blue")
        welcome_text.append("Personalized workout plans, progress tracking, and fitness assessment\n\n")
        
        if self.is_wide_terminal:
            welcome_text.append("Features: Workout Plans, Assessment, Tracking, Nutrition\n", style="bold")
            welcome_text.append("• AI-powered personalized workout plans (6-day training + rest)\n")
            welcome_text.append("• Fitness level assessment through rep-based questions\n")
            welcome_text.append("• Progress tracking with level advancement\n")
            welcome_text.append("• Equipment-aware exercise selection\n")
            welcome_text.append("• Goal-specific programs\n")
            welcome_text.append("• Calorie tracking & nutrition guidance\n")
            welcome_text.append("• Yoga practice planning & tracking\n")
        else:
            welcome_text.append("\n\nFeatures: Workout Plans, Assessment, Tracking", style="bold")
        
        console.print(Panel(welcome_text, title="Welcome", border_style="blue"))
        
        # Show quick stats if user is logged in
        if self.current_user:
            if self.is_wide_terminal:
                console.print(f"\n👤 Current User: {self.current_user.name}", style="green")
                console.print(f"🏆 Fitness Level: {self.current_user.fitness_level.title()}", style="blue")
            else:
                console.print(f"\n👤 {self.current_user.name} ({self.current_user.fitness_level.title()})", style="green")

    def main_menu(self):
        """Display main menu and handle user selection"""
        while True:
            console.print("\n" + "="*min(50, self.terminal_width))
            if self.is_wide_terminal:
                if self.current_user and self.current_user.fitness_type == "yoga":
                    console.print("🧘‍♀️ YOGA AI CLI - Main Menu", style="bold blue")
                else:
                    console.print("🏋️  GYM AI CLI - Main Menu", style="bold blue")
            else:
                if self.current_user and self.current_user.fitness_type == "yoga":
                    console.print("🧘‍♀️ YOGA AI CLI", style="bold blue")
                else:
                    console.print("🏋️  GYM AI CLI", style="bold blue")
            console.print("="*min(50, self.terminal_width))
            
            if self.current_user:
                sub = getattr(self.current_user, 'fitness_sublevel', 1)
                if self.is_wide_terminal:
                    if self.current_user.fitness_type == "yoga":
                        console.print(f"👤 Current User: {self.current_user.name} (Yoga {self.current_user.fitness_level.title()} {sub})", style="green")
                    else:
                        console.print(f"👤 Current User: {self.current_user.name} (Gym {self.current_user.fitness_level.title()} {sub})", style="green")
                else:
                    if self.current_user.fitness_type == "yoga":
                        console.print(f"👤 {self.current_user.name} (Yoga {self.current_user.fitness_level.title()})", style="green")
                    else:
                        console.print(f"👤 {self.current_user.name} (Gym {self.current_user.fitness_level.title()})", style="green")
                
                # Check if today's workout is completed
                workout_status = self._get_todays_workout_status()
                if workout_status == "completed":
                    console.print("✅ Today's session completed!", style="bold green")
                elif workout_status == "scheduled":
                    if self.current_user.fitness_type == "yoga":
                        console.print("📅 Yoga session scheduled for today", style="yellow")
                    else:
                        console.print("📅 Workout scheduled for today", style="yellow")
                elif workout_status == "no_plan":
                    if self.current_user.fitness_type == "yoga":
                        console.print("⚠️  No yoga plan found", style="red")
                    else:
                        console.print("⚠️  No workout plan found", style="red")
            
            # Adapt menu for terminal width and fitness type
            if self.is_wide_terminal:
                if self.current_user and self.current_user.fitness_type == "yoga":
                    menu_options = [
                        "1. 👤 User Management (Login/Register)",
                        "2. 🧭 Set Yoga Level",
                        "3. 🧘‍♀️ Yoga Planning",
                        "4. 📈 Yoga Progress Tracking",
                        "5. 🍎 Nutrition & Calories",
                        "6. 📊 View Reports & Analytics",
                        "7. ❌ Exit"
                    ]
                else:
                    menu_options = [
                        "1. 👤 User Management (Login/Register)",
                        "2. 🧭 Set Fitness Level",
                        "3. 🏃‍♂️ Workout Planning",
                        "4. 📈 Progress Tracking",
                        "5. 🍎 Nutrition & Calories",
                        "6. 📊 View Reports & Analytics",
                        "7. ❌ Exit"
                    ]
            else:
                if self.current_user and self.current_user.fitness_type == "yoga":
                    menu_options = [
                        "1. 👤 User Mgmt",
                        "2. 🧭 Yoga Level",
                        "3. 🧘‍♀️ Yoga",
                        "4. 📈 Progress",
                        "5. 🍎 Nutrition",
                        "6. 📊 Reports",
                        "7. ❌ Exit"
                    ]
                else:
                    menu_options = [
                        "1. 👤 User Mgmt",
                        "2. 🧭 Fitness Level",
                        "3. 🏃‍♂️ Workouts",
                        "4. 📈 Progress",
                        "5. 🍎 Nutrition",
                        "6. 📊 Reports",
                        "7. ❌ Exit"
                    ]
            
            for option in menu_options:
                console.print(option)
            
            choice = Prompt.ask("\nSelect an option", choices=["1", "2", "3", "4", "5", "6", "7"])
            
            if choice == "1":
                self.user_management_menu()
            elif choice == "2":
                if self.current_user and self.current_user.fitness_type == "yoga":
                    self.set_yoga_level_menu()
                else:
                    self.set_fitness_level_menu()
            elif choice == "3":
                if self.current_user and self.current_user.fitness_type == "yoga":
                    self.yoga_planning_menu()
                else:
                    self.workout_planning_menu()
            elif choice == "4":
                if self.current_user and self.current_user.fitness_type == "yoga":
                    self.yoga_progress_tracking_menu()
                else:
                    self.progress_tracking_menu()
            elif choice == "5":
                self.nutrition_menu()
            elif choice == "6":
                self.reports_menu()
            elif choice == "7":
                if Confirm.ask("Are you sure you want to exit?"):
                    console.print("👋 Thank you for using Gym AI CLI!", style="green")
                    break

    def user_management_menu(self):
        """Handle user login/registration"""
        console.print("\n" + "="*30)
        console.print("👤 User Management", style="bold blue")
        console.print("="*30)
        
        options = ["1. 🔐 Login", "2. 📝 Register New User", "3. 🔄 Switch User", "4. 🗑️  Delete User", "5. ⬅️  Back to Main Menu"]
        for option in options:
            console.print(option)
        
        choice = Prompt.ask("Select an option", choices=["1", "2", "3", "4", "5"])
        
        if choice == "1":
            self.login_user()
        elif choice == "2":
            self.register_user()
        elif choice == "3":
            self.switch_user()
        elif choice == "4":
            self.delete_user()
        elif choice == "5":
            return

    def login_user(self):
        """Login existing user"""
        username = Prompt.ask("Enter username")
        user = self.user_manager.get_user(username)
        
        if user:
            self.current_user = user
            if user.fitness_type == "yoga":
                console.print(f"✅ Welcome back, {user.name}! (Yoga Mode)", style="green")
            else:
                console.print(f"✅ Welcome back, {user.name}!", style="green")
        else:
            console.print("❌ User not found. Please register first.", style="red")

    def register_user(self):
        """Register new user with onboarding and input validation"""
        console.print("\n📝 New User Registration", style="bold blue")
        
        try:
            name = Prompt.ask("Enter your name").strip()
            if not name:
                console.print("❌ Name cannot be empty", style="red")
                return
                
            if len(name) < 2 or len(name) > 50:
                console.print("❌ Name must be between 2 and 50 characters", style="red")
                return
                
            age_input = Prompt.ask("Enter your age", default="25")
            try:
                age = int(age_input)
                if age < 13 or age > 120:
                    console.print("❌ Age must be between 13 and 120", style="red")
                    return
            except ValueError:
                console.print("❌ Age must be a valid number", style="red")
                return
                
            gender = Prompt.ask("Enter your gender", choices=["male", "female", "other"], default="male")
            
            current_weight_input = Prompt.ask("Enter your current weight (kg)", default="70")
            try:
                current_weight = float(current_weight_input)
                if current_weight < 20 or current_weight > 300:
                    console.print("❌ Weight must be between 20 and 300 kg", style="red")
                    return
            except ValueError:
                console.print("❌ Weight must be a valid number", style="red")
                return
                
            target_weight_input = Prompt.ask("Enter your target weight (kg)", default="65")
            try:
                target_weight = float(target_weight_input)
                if target_weight < 20 or target_weight > 300:
                    console.print("❌ Target weight must be between 20 and 300 kg", style="red")
                    return
            except ValueError:
                console.print("❌ Target weight must be a valid number", style="red")
                return
            
            # Validate weight relationship
            if abs(current_weight - target_weight) < 1:
                console.print("⚠️  Current and target weights are very similar", style="yellow")
            
            # Fitness type selection
            console.print("\n🧘‍♀️ Fitness Type:")
            console.print("Choose your preferred fitness approach:")
            console.print("1. 🏋️  Gym (Traditional weight training & bodyweight exercises)")
            console.print("2. 🧘‍♀️ Yoga (Flexibility, balance, meditation & poses)")
            console.print("3. 🔀 Mixed (Combination of gym and yoga)")
            
            fitness_type_choice = Prompt.ask("Select fitness type", choices=["1", "2", "3"], default="1")
            fitness_type = "gym" if fitness_type_choice == "1" else "yoga" if fitness_type_choice == "2" else "mixed"
            
            # Equipment access (only for gym or mixed)
            has_home_equipment = False
            has_gym_access = False
            if fitness_type in ["gym", "mixed"]:
                console.print("\n🏠 Equipment Access:")
                has_home_equipment = Confirm.ask("Do you have access to home equipment?")
                has_gym_access = Confirm.ask("Do you have gym access?")
            
            # Fitness goals based on fitness type
            console.print("\n🎯 Fitness Goals:")
            goals = []
            
            if fitness_type == "gym":
                if Confirm.ask("Fat loss?"):
                    goals.append("fat_loss")
                if Confirm.ask("Muscle gain?"):
                    goals.append("muscle_gain")
                if Confirm.ask("Endurance improvement?"):
                    goals.append("endurance")
                if Confirm.ask("Specific body part focus?"):
                    body_part = Prompt.ask("Which body part?", choices=["chest", "arms", "legs", "back", "shoulders", "core"])
                    goals.append(f"body_part_{body_part}")
            elif fitness_type == "yoga":
                # Ask for yoga approach
                console.print("\n🧘‍♀️ Yoga Approach:")
                console.print("1. 🔄 Progressive (Move through levels sequentially)")
                console.print("2. 🎯 Category Focus (Focus on specific goals)")
                console.print("3. 🔀 Mixed (Combination of approaches)")
                
                approach_choice = Prompt.ask("Select approach", choices=["1", "2", "3"], default="1")
                
                if approach_choice == "1":
                    goals.append("progressive")
                elif approach_choice == "2":
                    # Category-specific goals
                    if Confirm.ask("Flexibility enhancement?"):
                        goals.append("flexibility")
                    if Confirm.ask("Stress reduction & mental clarity?"):
                        goals.append("stress_reduction")
                    if Confirm.ask("Posture correction?"):
                        goals.append("posture")
                    if Confirm.ask("Balance & stability improvement?"):
                        goals.append("balance")
                    if Confirm.ask("Core strengthening?"):
                        goals.append("core_strength")
                    if Confirm.ask("Spinal health?"):
                        goals.append("spinal_health")
                    if Confirm.ask("Detoxification & organ support?"):
                        goals.append("detoxification")
                else:  # Mixed approach
                    goals.extend(["flexibility", "stress_reduction", "posture", "balance", "core_strength"])
            else:  # Mixed
                # Gym goals
                if Confirm.ask("Fat loss?"):
                    goals.append("fat_loss")
                if Confirm.ask("Muscle gain?"):
                    goals.append("muscle_gain")
                if Confirm.ask("Endurance improvement?"):
                    goals.append("endurance")
                
                # Yoga goals
                if Confirm.ask("Flexibility enhancement?"):
                    goals.append("flexibility")
                if Confirm.ask("Stress reduction?"):
                    goals.append("stress_reduction")
                if Confirm.ask("Balance improvement?"):
                    goals.append("balance")
            
            # Validate goals
            if not goals:
                console.print("⚠️  No goals selected. Adding general fitness goal.", style="yellow")
                goals.append("general_fitness")
            
            # Limit number of goals
            if len(goals) > 5:
                console.print("⚠️  Too many goals selected. Limiting to 5.", style="yellow")
                goals = goals[:5]
            
            user_data = {
                "name": name,
                "age": age,
                "gender": gender,
                "current_weight": current_weight,
                "target_weight": target_weight,
                "has_home_equipment": has_home_equipment,
                "has_gym_access": has_gym_access,
                "goals": goals,
                "fitness_type": fitness_type
            }
            
            user = self.user_manager.create_user(user_data)
            self.current_user = user
            
            # Auto-start fitness assessment
            if Confirm.ask(f"\nWould you like to complete a {'yoga' if fitness_type == 'yoga' else 'fitness'} assessment now?"):
                if fitness_type == "yoga":
                    from src.yoga_assessor import YogaAssessor
                    assessor = YogaAssessor()
                    assessor.conduct_assessment(user)
                elif fitness_type == "mixed":
                    # For mixed, do both assessments
                    self.fitness_assessor.conduct_assessment(user)
                    from src.yoga_assessor import YogaAssessor
                    assessor = YogaAssessor()
                    assessor.conduct_assessment(user)
                else:
                    self.fitness_assessor.conduct_assessment(user)
                
        except KeyboardInterrupt:
            console.print("\n❌ Registration cancelled", style="red")
        except Exception as e:
            console.print(f"\n❌ Error during registration: {e}", style="red")

    def set_fitness_level_menu(self):
        """Allow user to choose fitness level and sub-level manually"""
        if not self.current_user:
            console.print("❌ Please login first", style="red")
            return

        console.print("\n" + "="*30)
        console.print("🧭 Set Fitness Level", style="bold blue")
        console.print("="*30)

        # Guidance text
        console.print("\nGuidance (approximate targets):", style="bold yellow")
        console.print("• Beginner 1: ~5 push-ups, plank ~20s")
        console.print("• Beginner 2: ~10 push-ups, plank ~30s")
        console.print("• Intermediate 1: ~20 push-ups, plank ~60s")
        console.print("• Intermediate 2: ~30 push-ups, plank ~90s")
        console.print("• Advanced 1: ~40 push-ups, plank ~120s")
        console.print("• Advanced 2: ~50 push-ups, plank ~150s")
        console.print("• Expert 1: ~60 push-ups, plank ~180s")
        console.print("• Expert 2: 70+ push-ups, plank 200s+\n")

        level = Prompt.ask("Select level", choices=["beginner", "intermediate", "advanced", "expert"], default=self.current_user.fitness_level)
        sublevel = int(Prompt.ask("Select sub-level (1 or 2)", choices=["1", "2"], default="1"))

        self.current_user.fitness_level = level
        self.current_user.fitness_sublevel = sublevel
        self.user_manager.update_user(self.current_user)

        console.print(f"✅ Set level to {level.title()} {sublevel}", style="green")

    def set_yoga_level_menu(self):
        """Allow user to choose yoga level and sub-level manually"""
        if not self.current_user:
            console.print("❌ Please login first", style="red")
            return

        console.print("\n" + "="*30)
        console.print("🧭 Set Yoga Level", style="bold blue")
        console.print("="*30)

        # Guidance text
        console.print("\nGuidance (approximate targets):", style="bold yellow")
        console.print("• Beginner: New to yoga, building foundation")
        console.print("• Intermediate: Regular practice, improving skills")
        console.print("• Advanced: Experienced practitioner, strong foundation")
        console.print("• Expert: Master level practitioner\n")

        level = Prompt.ask("Select level", choices=["beginner", "intermediate", "advanced", "expert"], default=self.current_user.fitness_level)
        
        self.current_user.fitness_level = level
        self.user_manager.update_user(self.current_user)

        console.print(f"✅ Set yoga level to {level.title()}", style="green")

    def switch_user(self):
        """Switch to different user"""
        users = self.user_manager.list_users()
        if not users:
            console.print("❌ No users found. Please register first.", style="red")
            return
        
        console.print("\nAvailable users:")
        for i, user in enumerate(users, 1):
            console.print(f"{i}. {user.name}")
        
        try:
            choice = int(Prompt.ask("Select user number")) - 1
            if 0 <= choice < len(users):
                self.current_user = users[choice]
                console.print(f"✅ Switched to {self.current_user.name}", style="green")
            else:
                console.print("❌ Invalid selection", style="red")
        except ValueError:
            console.print("❌ Please enter a valid number", style="red")

    def delete_user(self):
        """Delete a user account"""
        users = self.user_manager.list_users()
        if not users:
            console.print("❌ No users found to delete.", style="red")
            return
        
        console.print("\n🗑️  Delete User Account", style="bold red")
        console.print("="*30)
        
        console.print("Available users:")
        for i, user in enumerate(users, 1):
            console.print(f"{i}. {user.name}")
        
        try:
            choice = int(Prompt.ask("Select user number to delete")) - 1
            if 0 <= choice < len(users):
                user_to_delete = users[choice]
                
                # Show user details
                console.print(f"\nUser to delete: {user_to_delete.name}", style="yellow")
                console.print(f"Age: {user_to_delete.age}")
                console.print(f"Fitness Level: {user_to_delete.fitness_level}")
                console.print(f"Total Workouts: {user_to_delete.total_workouts}")
                console.print(f"Workout Streak: {user_to_delete.workout_streak}")
                
                # Confirmation
                console.print("\n⚠️  WARNING: This will permanently delete:", style="bold red")
                console.print("• User profile and settings")
                console.print("• All workout history and logs")
                console.print("• Progress data and statistics")
                console.print("• Workout plans")
                
                if Confirm.ask("Are you absolutely sure you want to delete this user?"):
                    if Confirm.ask("This action cannot be undone. Type 'yes' to confirm"):
                        # Delete user data
                        success = self.user_manager.delete_user(user_to_delete.id)
                        
                        if success:
                            console.print(f"✅ User '{user_to_delete.name}' deleted successfully!", style="green")
                            
                            # If deleted user was current user, clear current user
                            if self.current_user and self.current_user.id == user_to_delete.id:
                                self.current_user = None
                                console.print("🔄 Current user cleared. Please login with another account.", style="yellow")
                            
                            # Also delete associated workout plans and logs
                            self._cleanup_user_data(user_to_delete.id)
                        else:
                            console.print("❌ Failed to delete user.", style="red")
                    else:
                        console.print("❌ Deletion cancelled.", style="yellow")
                else:
                    console.print("❌ Deletion cancelled.", style="yellow")
            else:
                console.print("❌ Invalid selection", style="red")
        except ValueError:
            console.print("❌ Please enter a valid number", style="red")
    
    def _cleanup_user_data(self, user_id: str):
        """Clean up user data from workout plans and logs"""
        try:
            # Clean up workout plans
            from src.workout_planner import WorkoutPlanner
            planner = WorkoutPlanner()
            
            if os.path.exists(planner.plans_file):
                with open(planner.plans_file, 'r') as f:
                    plans = json.load(f)
                
                if user_id in plans:
                    del plans[user_id]
                    
                    with open(planner.plans_file, 'w') as f:
                        json.dump(plans, f, indent=2)
                    console.print("✅ Workout plans deleted", style="green")
            
            # Clean up workout logs
            from src.progress_tracker import ProgressTracker
            tracker = ProgressTracker()
            
            if os.path.exists(tracker.logs_file):
                with open(tracker.logs_file, 'r') as f:
                    logs = json.load(f)
                
                if user_id in logs:
                    del logs[user_id]
                    
                    with open(tracker.logs_file, 'w') as f:
                        json.dump(logs, f, indent=2)
                    console.print("✅ Workout logs deleted", style="green")
                    
        except Exception as e:
            console.print(f"⚠️  Warning: Some user data may not have been deleted: {e}", style="yellow")

    def fitness_assessment_menu(self):
        """Handle fitness assessment"""
        if not self.current_user:
            console.print("❌ Please login first", style="red")
            return
        
        console.print("\n" + "="*30)
        console.print("📊 Fitness Assessment", style="bold blue")
        console.print("="*30)
        
        if self.current_user.fitness_level == "unassessed":
            console.print("🔍 Let's assess your fitness level!", style="yellow")
            self.fitness_assessor.conduct_assessment(self.current_user)
        else:
            console.print(f"Current fitness level: {self.current_user.fitness_level}", style="green")
            if Confirm.ask("Would you like to retake the assessment?"):
                self.fitness_assessor.conduct_assessment(self.current_user)

    def workout_planning_menu(self):
        """Handle workout planning"""
        if not self.current_user:
            console.print("❌ Please login first", style="red")
            return
        
        console.print("\n" + "="*30)
        console.print("🏃‍♂️ Workout Planning", style="bold blue")
        console.print("="*30)
        
        if self.current_user.fitness_level == "unassessed":
            console.print("❗ No fitness level set.", style="yellow")
            self.set_fitness_level_menu()
            if self.current_user.fitness_level == "unassessed":
                console.print("❌ Fitness level not set. Cannot create plan.", style="red")
                return
        
        # Ask desired session length
        try:
            session_minutes = int(Prompt.ask("How many minutes per session?", default="30"))
        except Exception:
            session_minutes = 30
        
        self.workout_planner.create_workout_plan(self.current_user, session_minutes=session_minutes)

    def yoga_planning_menu(self):
        """Handle yoga planning"""
        if not self.current_user:
            console.print("❌ Please login first", style="red")
            return
        
        console.print("\n" + "="*30)
        console.print("🧘‍♀️ Yoga Planning", style="bold blue")
        console.print("="*30)
        
        # Import here to avoid circular imports
        from src.yoga_planner import YogaPlanner
        yoga_planner = YogaPlanner()
        
        # Check if user has an existing plan
        existing_plan = yoga_planner.load_yoga_plan(self.current_user.id)
        
        if not existing_plan:
            console.print("No existing yoga plan found. Creating one for you...", style="yellow")
            try:
                session_minutes = int(Prompt.ask("How many minutes per session?", default="30"))
            except Exception:
                session_minutes = 30
            
            yoga_planner.create_yoga_plan(self.current_user, session_minutes=session_minutes)
            existing_plan = yoga_planner.load_yoga_plan(self.current_user.id)
        
        # Check if user wants to create a new plan or view existing
        console.print("1. 📋 View Current Yoga Plan")
        console.print("2. 🔄 Create New Yoga Plan")
        console.print("3. ⬅️  Back to Main Menu")
        
        choice = Prompt.ask("Select an option", choices=["1", "2", "3"])
        
        if choice == "1":
            yoga_planner.display_yoga_plan(self.current_user)
        elif choice == "2":
            # Ask desired session length
            try:
                session_minutes = int(Prompt.ask("How many minutes per session?", default="30"))
            except Exception:
                session_minutes = 30
            
            yoga_planner.create_yoga_plan(self.current_user, session_minutes=session_minutes)
            yoga_planner.display_yoga_plan(self.current_user)
        elif choice == "3":
            return

    def progress_tracking_menu(self):
        """Handle progress tracking"""
        if not self.current_user:
            console.print("❌ Please login first", style="red")
            return
        
        console.print("\n" + "="*30)
        console.print("📈 Progress Tracking", style="bold blue")
        console.print("="*30)
        
        self.progress_tracker.track_workout(self.current_user)

    def yoga_progress_tracking_menu(self):
        """Handle yoga progress tracking"""
        if not self.current_user:
            console.print("❌ Please login first", style="red")
            return
        
        console.print("\n" + "="*30)
        console.print("📈 Yoga Progress Tracking", style="bold blue")
        console.print("="*30)
        
        from src.yoga_tracker import YogaTracker
        yoga_tracker = YogaTracker()
        
        # Check if user wants to log a session or view reports
        console.print("1. 📝 Log Yoga Session")
        console.print("2. 📊 View Progress Reports")
        console.print("3. ⬅️  Back to Main Menu")
        
        choice = Prompt.ask("Select an option", choices=["1", "2", "3"])
        
        if choice == "1":
            yoga_tracker.track_yoga_session(self.current_user)
        elif choice == "2":
            yoga_tracker.show_yoga_progress(self.current_user)
        elif choice == "3":
            return

    def nutrition_menu(self):
        """Handle nutrition and calorie tracking"""
        if not self.current_user:
            console.print("❌ Please login first", style="red")
            return
        
        console.print("\n" + "="*30)
        console.print("🍎 Nutrition & Calories", style="bold blue")
        console.print("="*30)
        
        from src.nutrition_tracker import NutritionTracker
        from rich.table import Table
        nutrition_tracker = NutritionTracker()
        
        # Show current nutrition summary
        nutrition_tracker.show_nutrition_summary(self.current_user)
        
        # Options
        console.print("\nOptions:")
        console.print("1. 📝 Log Meal")
        console.print("2. 📊 View Nutrition History")
        console.print("3. ⬅️  Back to Main Menu")
        
        choice = Prompt.ask("Select an option", choices=["1", "2", "3"])
        
        if choice == "1":
            # Log a meal
            console.print("\n📝 Log your meal:")
            console.print("You can either:")
            console.print("1. Describe what you ate (we'll estimate calories)")
            console.print("2. Enter calories directly")
            
            log_choice = Prompt.ask("Choose option", choices=["1", "2"], default="1")
            
            if log_choice == "1":
                meal_description = Prompt.ask("Describe what you ate (e.g., '2 boiled eggs, 1 slice toast')")
                nutrition_tracker.log_meal(self.current_user, meal_description, None)
            else:
                try:
                    calories = float(Prompt.ask("Enter calories consumed"))
                    nutrition_tracker.log_meal(self.current_user, None, calories)
                except ValueError:
                    console.print("Invalid calorie value. Please enter a number.", style="red")
            
            # Show updated summary
            nutrition_tracker.show_nutrition_summary(self.current_user)
            
        elif choice == "2":
            # View nutrition history
            if self.current_user.calorie_balance_history:
                history_table = Table(title="Nutrition History", show_header=True, header_style="bold magenta")
                history_table.add_column("Week", style="cyan")
                history_table.add_column("Consumed", style="green")
                history_table.add_column("Burned", style="red")
                history_table.add_column("Net Balance", style="blue")
                
                for entry in self.current_user.calorie_balance_history:
                    week_start = datetime.fromisoformat(entry["week_start"]).strftime('%m/%d')
                    history_table.add_row(
                        week_start,
                        f"{entry['calories_consumed']:.0f}",
                        f"{entry['calories_burned']:.0f}",
                        f"{entry['net_balance']:.0f}"
                    )
                
                console.print(history_table)
            else:
                console.print("No nutrition history available.", style="yellow")

    def reports_menu(self):
        """Handle reports and analytics"""
        if not self.current_user:
            console.print("❌ Please login first", style="red")
            return
        
        console.print("\n" + "="*30)
        console.print("📊 Reports & Analytics", style="bold blue")
        console.print("="*30)
        
        if self.current_user.fitness_type == "yoga":
            from src.yoga_tracker import YogaTracker
            yoga_tracker = YogaTracker()
            yoga_tracker.show_yoga_progress(self.current_user)
            
            # Ask if user wants to generate charts
            if Confirm.ask("\nWould you like to generate progress charts?"):
                yoga_tracker.generate_yoga_progress_charts(self.current_user)
        else:
            self.progress_tracker.show_progress_reports(self.current_user)
            
            # Ask if user wants to generate charts
            if Confirm.ask("\nWould you like to generate progress charts?"):
                self.progress_tracker.generate_progress_charts(self.current_user)
    # settings_menu removed (time shift feature removed)
    
    def _get_todays_workout_status(self) -> str:
        """Get today's workout status"""
        if not self.current_user:
            return "no_user"
        
        try:
            # Check if user has a workout plan
            from src.workout_planner import WorkoutPlanner
            planner = WorkoutPlanner()
            plan = planner.load_workout_plan(self.current_user.id)
            
            if not plan:
                return "no_plan"
            
            # Check if today has a scheduled workout
            today = datetime.now().strftime("%A").lower()
            if today not in plan.sessions:
                return "no_workout_scheduled"
            
            # Check if workout was already completed today
            from src.progress_tracker import ProgressTracker
            tracker = ProgressTracker()
            if tracker._is_workout_completed_today(self.current_user.id, today):
                return "completed"
            else:
                return "scheduled"
                
        except Exception as e:
            console.print(f"Debug: Error in _get_todays_workout_status: {e}", style="red")
            return "error"