"""
Workout Planning Module
Creates personalized workout plans based on user profile and goals
"""

import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from rich.console import Console
from rich.prompt import Prompt, Confirm, IntPrompt
from rich.panel import Panel
from rich.table import Table
from rich.text import Text

from pydantic import BaseModel
from src.user_manager import User
from src.exercise_database import ExerciseDatabase, BodyPart, GoalType, EquipmentType

console = Console()

class WorkoutSession(BaseModel):
    """Individual workout session model"""
    date: datetime
    exercises: List[Dict]  # List of exercise details with sets/reps
    duration_minutes: int
    calories_burned: float
    completed: bool = False
    notes: str = ""

class WeeklyWorkoutPlan(BaseModel):
    """Weekly workout plan model"""
    week_start: datetime
    user_id: str
    sessions: Dict[str, WorkoutSession]  # Day of week -> session
    goals: List[str]
    total_calories_target: float
    notes: str = ""

class WorkoutPlanner:
    """Creates and manages workout plans"""
    
    def __init__(self):
        self.exercise_db = ExerciseDatabase()
        self.plans_file = "data/workout_plans.json"
        self.backup_dir = "data/backup"
        # Fixed, specific rep targets per exercise (level -> [sub1, sub2])
        # Values represent reps; for time-based moves, values represent seconds
        self.exercise_reps_map = {
            # Chest
            "push-ups": {"beginner": [8, 10], "intermediate": [12, 14], "advanced": [15, 18], "expert": [20, 25]},
            "incline push-ups": {"beginner": [10, 12], "intermediate": [14, 16], "advanced": [18, 20], "expert": [22, 26]},
            "decline push-ups": {"beginner": [6, 8], "intermediate": [10, 12], "advanced": [14, 16], "expert": [18, 22]},
            "dumbbell flyes": {"beginner": [10, 12], "intermediate": [12, 14], "advanced": [15, 18], "expert": [18, 22]},
            "dumbbell press": {"beginner": [8, 10], "intermediate": [12, 14], "advanced": [15, 18], "expert": [20, 25]},
            "bench press": {"beginner": [8, 10], "intermediate": [12, 14], "advanced": [15, 18], "expert": [20, 25]},
            "chest dips": {"beginner": [6, 8], "intermediate": [10, 12], "advanced": [12, 15], "expert": [15, 20]},
            "cable flyes": {"beginner": [10, 12], "intermediate": [12, 14], "advanced": [15, 18], "expert": [18, 22]},
            # Back
            "pull-ups": {"beginner": [3, 5], "intermediate": [6, 8], "advanced": [10, 13], "expert": [14, 19]},
            "bent-over rows": {"beginner": [8, 10], "intermediate": [12, 14], "advanced": [15, 18], "expert": [18, 22]},
            "lat pulldowns": {"beginner": [10, 12], "intermediate": [12, 14], "advanced": [15, 18], "expert": [18, 22]},
            "seated rows": {"beginner": [10, 12], "intermediate": [12, 14], "advanced": [15, 18], "expert": [18, 22]},
            "reverse flyes": {"beginner": [10, 12], "intermediate": [12, 14], "advanced": [15, 18], "expert": [18, 22]},
            "superman": {"beginner": [12, 15], "intermediate": [15, 18], "advanced": [18, 22], "expert": [22, 26]},
            "deadlifts": {"beginner": [6, 8], "intermediate": [8, 10], "advanced": [10, 12], "expert": [12, 15]},
            # Legs
            "squats": {"beginner": [12, 15], "intermediate": [15, 18], "advanced": [18, 22], "expert": [22, 26]},
            "lunges": {"beginner": [10, 12], "intermediate": [12, 14], "advanced": [14, 16], "expert": [16, 20]},
            "calf raises": {"beginner": [12, 15], "intermediate": [15, 18], "advanced": [18, 22], "expert": [22, 26]},
            "wall sits": {"beginner": [30, 40], "intermediate": [45, 55], "advanced": [60, 70], "expert": [90, 100]},
            "step-ups": {"beginner": [10, 12], "intermediate": [12, 14], "advanced": [14, 16], "expert": [16, 20]},
            "leg press": {"beginner": [10, 12], "intermediate": [12, 14], "advanced": [14, 16], "expert": [16, 20]},
            "bulgarian split squats": {"beginner": [8, 10], "intermediate": [10, 12], "advanced": [12, 14], "expert": [14, 16]},
            # Shoulders / Arms
            "shoulder press": {"beginner": [8, 10], "intermediate": [12, 14], "advanced": [15, 18], "expert": [18, 22]},
            "lateral raises": {"beginner": [10, 12], "intermediate": [12, 14], "advanced": [15, 18], "expert": [18, 22]},
            "tricep dips": {"beginner": [8, 10], "intermediate": [10, 12], "advanced": [12, 15], "expert": [15, 20]},
            "close grip push-ups": {"beginner": [8, 10], "intermediate": [10, 12], "advanced": [12, 15], "expert": [15, 20]},
            "bicep curls": {"beginner": [10, 12], "intermediate": [12, 14], "advanced": [15, 18], "expert": [18, 22]},
            "hammer curls": {"beginner": [10, 12], "intermediate": [12, 14], "advanced": [15, 18], "expert": [18, 22]},
            "overhead tricep extension": {"beginner": [10, 12], "intermediate": [12, 14], "advanced": [15, 18], "expert": [18, 22]},
            "resistance band curls": {"beginner": [12, 15], "intermediate": [15, 18], "advanced": [18, 22], "expert": [22, 26]},
            "cable tricep pushdowns": {"beginner": [10, 12], "intermediate": [12, 14], "advanced": [15, 18], "expert": [18, 22]},
            # Core / Cardio
            "plank": {"beginner": [30, 40], "intermediate": [45, 60], "advanced": [60, 90], "expert": [90, 120]},
            "crunches": {"beginner": [12, 15], "intermediate": [15, 18], "advanced": [18, 22], "expert": [22, 26]},
            "mountain climbers": {"beginner": [30, 40], "intermediate": [45, 60], "advanced": [60, 75], "expert": [90, 120]},
            "russian twists": {"beginner": [12, 15], "intermediate": [15, 18], "advanced": [18, 22], "expert": [22, 26]},
            "dead bug": {"beginner": [10, 12], "intermediate": [12, 14], "advanced": [14, 16], "expert": [16, 20]},
            "hanging leg raises": {"beginner": [6, 8], "intermediate": [8, 10], "advanced": [10, 12], "expert": [12, 15]},
            "cable woodchops": {"beginner": [10, 12], "intermediate": [12, 14], "advanced": [14, 16], "expert": [16, 20]},
        }
        self._ensure_data_directory()
    
    def _ensure_data_directory(self):
        """Ensure data directory exists"""
        os.makedirs(os.path.dirname(self.plans_file), exist_ok=True)
        os.makedirs(self.backup_dir, exist_ok=True)
    
    def _create_backup(self, file_path: str) -> bool:
        """Create a backup of a data file"""
        try:
            if not os.path.exists(file_path):
                return True  # No file to backup
                
            # Create timestamped backup
            from datetime import datetime
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = os.path.basename(file_path)
            backup_path = os.path.join(self.backup_dir, f"{filename}.{timestamp}.bak")
            
            # Copy file
            import shutil
            shutil.copy2(file_path, backup_path)
            
            # Keep only last 5 backups
            self._cleanup_old_backups(file_path)
            
            return True
        except Exception as e:
            console.print(f"⚠️  Failed to create backup: {e}", style="yellow")
            return False
    
    def _cleanup_old_backups(self, file_path: str):
        """Keep only the 5 most recent backups"""
        try:
            filename = os.path.basename(file_path)
            backup_files = []
            
            for file in os.listdir(self.backup_dir):
                if file.startswith(filename) and file.endswith('.bak'):
                    backup_files.append(os.path.join(self.backup_dir, file))
            
            # Sort by modification time and keep only recent ones
            backup_files.sort(key=lambda x: os.path.getmtime(x), reverse=True)
            
            # Remove old backups
            for old_backup in backup_files[5:]:
                try:
                    os.remove(old_backup)
                except Exception:
                    pass
        except Exception:
            pass  # Ignore backup cleanup errors
    
    def create_workout_plan(self, user: User, session_minutes: int = 30) -> Optional[WeeklyWorkoutPlan]:
        """Create a personalized workout plan for the user"""
        console.print("\n" + "="*50)
        console.print("🏃‍♂️ WORKOUT PLANNING", style="bold blue")
        console.print("="*50)
        
        console.print(f"Creating workout plan for {user.name}", style="green")
        console.print(f"Fitness Level: {user.fitness_level.title()}", style="blue")
        console.print(f"Goals: {', '.join(user.goals)}", style="blue")
        
        # Get available exercises based on equipment
        available_exercises = self.exercise_db.get_available_exercises(
            user.has_home_equipment, user.has_gym_access
        )
        
        if not available_exercises:
            console.print("❌ No exercises available with your current equipment setup", style="red")
            return None
        
        # Create workout plan
        plan = self._generate_weekly_plan(user, available_exercises, session_minutes)
        
        # Display plan
        self._display_workout_plan(plan)
        
        # Save plan
        self._save_workout_plan(plan)
        
        return plan
    
    def _generate_weekly_plan(self, user: User, available_exercises: List, session_minutes: int) -> WeeklyWorkoutPlan:
        """Generate a weekly workout plan with 6 training days and Sunday rest"""
        week_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Create sessions for the week (6 training days + Sunday rest)
        sessions = {}
        
        # Define weekly schedule with specific body part focus
        weekly_schedule = {
            "monday": BodyPart.CHEST,
            "tuesday": BodyPart.BACK,
            "wednesday": BodyPart.LEGS,
            "thursday": BodyPart.SHOULDERS,
            "friday": BodyPart.ARMS,
            "saturday": BodyPart.CORE,
            "sunday": None  # Rest day
        }
        
        # Create workout sessions for training days only
        for day, body_part in weekly_schedule.items():
            if body_part is None:  # Sunday - rest day
                continue
                
            session_exercises = self._select_exercises_for_body_part(
                user, available_exercises, body_part, day, session_minutes
            )
            
            if session_exercises:  # Only create session if exercises are available
                session = WorkoutSession(
                    date=week_start + timedelta(days=list(weekly_schedule.keys()).index(day)),
                    exercises=session_exercises,
                    duration_minutes=self._calculate_session_duration(session_exercises, session_minutes),
                    calories_burned=0.0  # Will be calculated during workout
                )
                
                sessions[day] = session
        
        # Calculate total calories target
        total_calories = sum(
            self._estimate_calories_burned(session.exercises, user.current_weight)
            for session in sessions.values()
        )
        
        plan = WeeklyWorkoutPlan(
            week_start=week_start,
            user_id=user.id,
            sessions=sessions,
            goals=user.goals,
            total_calories_target=total_calories
        )
        
        return plan
    
    def _get_workout_frequency(self, fitness_level: str) -> int:
        """Get recommended workout frequency based on fitness level"""
        frequency_map = {
            "beginner": 3,
            "intermediate": 4,
            "advanced": 5,
            "expert": 6
        }
        return frequency_map.get(fitness_level, 3)
    
    def _map_goals_to_body_parts(self, goals: List[str]) -> List[BodyPart]:
        """Map user goals to relevant body parts"""
        body_parts = []
        
        for goal in goals:
            if goal == "fat_loss":
                body_parts.extend([BodyPart.FULL_BODY, BodyPart.CARDIO])
            elif goal == "muscle_gain":
                body_parts.extend([BodyPart.CHEST, BodyPart.BACK, BodyPart.LEGS, BodyPart.ARMS, BodyPart.SHOULDERS])
            elif goal == "endurance":
                body_parts.extend([BodyPart.CARDIO, BodyPart.FULL_BODY])
            elif goal.startswith("body_part_"):
                body_part = goal.replace("body_part_", "")
                if body_part in [bp.value for bp in BodyPart]:
                    body_parts.append(BodyPart(body_part))
        
        # Remove duplicates and ensure we have some body parts
        body_parts = list(set(body_parts))
        if not body_parts:
            body_parts = [BodyPart.FULL_BODY]
        
        return body_parts
    
    def _select_exercises_for_body_part(self, user: User, available_exercises: List, 
                                      target_body_part: BodyPart, day: str, session_minutes: int) -> List[Dict]:
        """Select exercises for a specific body part session"""
        # Filter exercises by target body part and difficulty
        suitable_exercises = []
        
        for exercise in available_exercises:
            # Check difficulty level compatibility
            if self._is_difficulty_suitable(exercise.difficulty, user.fitness_level):
                # Check if exercise targets the specific body part
                if target_body_part in exercise.body_parts:
                    suitable_exercises.append(exercise)
        
        # If no exercises found for specific body part, try related body parts
        if not suitable_exercises:
            related_parts = self._get_related_body_parts(target_body_part)
            for exercise in available_exercises:
                if self._is_difficulty_suitable(exercise.difficulty, user.fitness_level):
                    if any(part in exercise.body_parts for part in related_parts):
                        suitable_exercises.append(exercise)
        
        # Select exercises to fit target duration (aim 6-7 exercises if time allows)
        # Assume ~4-6 minutes per exercise depending on sets
        selected_exercises = []
        estimated_minutes = 0
        for ex in suitable_exercises:
            sets, reps = self._get_sets_and_reps(ex, user.fitness_level, getattr(user, 'fitness_sublevel', 1))
            per_ex_minutes = self._estimate_exercise_time_minutes(ex, sets, reps)
            if estimated_minutes + per_ex_minutes <= session_minutes or len(selected_exercises) < 4:
                selected_exercises.append(ex)
                estimated_minutes += per_ex_minutes
            if estimated_minutes >= session_minutes and len(selected_exercises) >= 6:
                break
        
        # Create exercise details with sets and reps
        session_exercises = []
        for exercise in selected_exercises[:7]:
            sets, reps = self._get_sets_and_reps(exercise, user.fitness_level, getattr(user, 'fitness_sublevel', 1))
            
            session_exercises.append({
                "name": exercise.name,
                "description": exercise.description,
                "sets": sets,
                "reps": reps,
                "calories_per_minute": exercise.calories_per_minute,
                "instructions": exercise.instructions,
                "tips": exercise.tips,
                "body_parts": [bp.value for bp in exercise.body_parts]
            })
        
        return session_exercises
    
    def _is_difficulty_suitable(self, exercise_difficulty: str, user_fitness_level: str) -> bool:
        """Check if exercise difficulty is suitable for user fitness level"""
        if exercise_difficulty == user_fitness_level:
            return True
        elif user_fitness_level == "beginner" and exercise_difficulty in ["beginner", "intermediate"]:
            return True
        elif user_fitness_level == "intermediate" and exercise_difficulty in ["beginner", "intermediate", "advanced"]:
            return True
        elif user_fitness_level in ["advanced", "expert"]:
            return True
        return False
    
    def _get_related_body_parts(self, target_body_part: BodyPart) -> List[BodyPart]:
        """Get related body parts for fallback exercise selection"""
        related_map = {
            BodyPart.CHEST: [BodyPart.ARMS, BodyPart.SHOULDERS],
            BodyPart.BACK: [BodyPart.ARMS, BodyPart.SHOULDERS],
            BodyPart.LEGS: [BodyPart.CORE],
            BodyPart.ARMS: [BodyPart.CHEST, BodyPart.BACK],
            BodyPart.SHOULDERS: [BodyPart.CHEST, BodyPart.BACK, BodyPart.ARMS],
            BodyPart.CORE: [BodyPart.LEGS, BodyPart.FULL_BODY]
        }
        return related_map.get(target_body_part, [BodyPart.FULL_BODY])
    
    def _select_exercises_for_session(self, user: User, available_exercises: List, 
                                    body_part_focus: List[BodyPart], day: str) -> List[Dict]:
        """Select exercises for a specific session (legacy method for compatibility)"""
        # This method is kept for backward compatibility
        # Use the new body-part specific method instead
        if body_part_focus:
            return self._select_exercises_for_body_part(user, available_exercises, body_part_focus[0], day, 30)  # Default 30 minutes
        else:
            return self._select_exercises_for_body_part(user, available_exercises, BodyPart.FULL_BODY, day, 30)  # Default 30 minutes
    
    def _get_sets_and_reps(self, exercise, fitness_level: str, fitness_sublevel: int = 1) -> Tuple[int, int]:
        """Get recommended sets and reps based on fitness level/sublevel and exercise characteristics"""
        name = exercise.name.lower()
        is_cardio = "cardio" in [bp.value for bp in exercise.body_parts]

        # Time-based movements
        time_based = any(k in name for k in ["plank", "mountain", "wall sit", "wall_sit", "sprint"]) or (
            "core" in [bp.value for bp in exercise.body_parts] and is_cardio)

        # If we have a fixed mapping, use it
        if name in self.exercise_reps_map and fitness_level in self.exercise_reps_map[name]:
            arr = self.exercise_reps_map[name][fitness_level]
            value = arr[0] if fitness_sublevel == 1 else arr[1]
            sets_map = {"beginner": 2, "intermediate": 3, "advanced": 4, "expert": 4}
            return sets_map.get(fitness_level, 3), int(value)

        # Determine base reps/seconds by movement type
        if "pull-up" in name or "pull ups" in name or "pull-ups" in name:
            base = {"beginner": 3, "intermediate": 6, "advanced": 10, "expert": 14}
        elif "dip" in name:
            base = {"beginner": 6, "intermediate": 10, "advanced": 12, "expert": 15}
        elif "push" in name or "press" in name or "row" in name or "fly" in name:
            base = {"beginner": 8, "intermediate": 12, "advanced": 15, "expert": 20}
        elif "squat" in name or "lunge" in name or "step" in name or "calf" in name:
            base = {"beginner": 10, "intermediate": 14, "advanced": 16, "expert": 20}
        elif time_based or is_cardio:
            base = {"beginner": 30, "intermediate": 45, "advanced": 60, "expert": 90}
        else:
            base = {"beginner": 10, "intermediate": 12, "advanced": 15, "expert": 18}

        # Sublevel adjustment (1 = low end, 2 = high end)
        bump = {"beginner": 2, "intermediate": 2, "advanced": 3, "expert": 5}
        value = base.get(fitness_level, 10)
        if fitness_sublevel == 2:
            value += bump.get(fitness_level, 2)

        # Sets by level
        sets_map = {"beginner": 2, "intermediate": 3, "advanced": 4, "expert": 4}
        sets = sets_map.get(fitness_level, 3)

        return sets, int(value)
    
    def _calculate_session_duration(self, exercises: List[Dict], target_minutes: int) -> int:
        """Calculate estimated session duration in minutes, clamp to target +/- 5"""
        total = 0
        for ex in exercises:
            total += self._estimate_exercise_time_minutes_simple(ex)
        # Clamp near target
        if abs(total - target_minutes) <= 5:
            return total
        return max(target_minutes - 5, min(target_minutes + 5, total))

    def _estimate_exercise_time_minutes(self, exercise, sets: int, reps: int) -> int:
        """Rough estimate minutes for an exercise before building details"""
        avg_seconds_per_rep = 3
        work = (reps * avg_seconds_per_rep) * sets
        rest = max(30, 60 if sets >= 3 else 45) * (sets - 1)
        return int((work + rest) / 60) or 3

    def _estimate_exercise_time_minutes_simple(self, ex: Dict) -> int:
        """Estimate minutes from an already formed exercise dict"""
        sets = ex.get('sets', 3)
        reps = ex.get('reps', 10)
        return self._estimate_exercise_time_minutes(None, sets, reps)
    
    def _estimate_calories_burned(self, exercises: List[Dict], weight: float) -> float:
        """Estimate calories burned for a session"""
        total_calories = 0
        for exercise in exercises:
            # Estimate 3 minutes per exercise (including rest)
            duration = 3
            calories = exercise["calories_per_minute"] * duration * (weight / 70)  # Normalize to 70kg
            total_calories += calories
        return total_calories
    
    def _display_workout_plan(self, plan: WeeklyWorkoutPlan):
        """Display the workout plan in a nice format"""
        console.print("\n" + "="*50)
        console.print("📋 YOUR WEEKLY WORKOUT PLAN", style="bold green")
        console.print("="*50)
        
        # Plan summary
        summary_text = Text()
        summary_text.append(f"Week Starting: {plan.week_start.strftime('%B %d, %Y')}\n", style="bold")
        summary_text.append(f"Training Days: {len(plan.sessions)} (6 days + Sunday rest)\n")
        summary_text.append(f"Estimated Calories: {plan.total_calories_target:.0f}\n")
        summary_text.append(f"Goals: {', '.join(plan.goals)}\n")
        summary_text.append("\n📅 Weekly Schedule:\n", style="bold")
        summary_text.append("• Monday: Chest Day\n")
        summary_text.append("• Tuesday: Back Day\n")
        summary_text.append("• Wednesday: Legs Day\n")
        summary_text.append("• Thursday: Shoulders Day\n")
        summary_text.append("• Friday: Arms Day\n")
        summary_text.append("• Saturday: Core Day\n")
        summary_text.append("• Sunday: Rest Day 🛌\n")
        
        console.print(Panel(summary_text, title="Plan Summary", border_style="green"))
        
        # Daily sessions
        day_focus = {
            "monday": "🏋️‍♂️ CHEST DAY",
            "tuesday": "💪 BACK DAY", 
            "wednesday": "🦵 LEGS DAY",
            "thursday": "🤸 SHOULDERS DAY",
            "friday": "💪 ARMS DAY",
            "saturday": "🔥 CORE DAY"
        }
        
        for day, session in plan.sessions.items():
            focus_title = day_focus.get(day, f"📅 {day.title()}")
            console.print(f"\n{focus_title}", style="bold blue")
            
            table = Table(show_header=True, header_style="bold magenta")
            table.add_column("Exercise", style="cyan")
            table.add_column("Sets", justify="center")
            table.add_column("Reps", justify="center")
            table.add_column("Body Parts", justify="center")
            table.add_column("Duration", justify="center")
            
            for exercise in session.exercises:
                body_parts = ", ".join(exercise.get("body_parts", ["N/A"]))
                duration_min = self._estimate_exercise_time_minutes_simple(exercise)
                table.add_row(
                    exercise["name"],
                    str(exercise["sets"]),
                    str(exercise["reps"]),
                    body_parts,
                    f"~{duration_min} min"
                )
            
            console.print(table)
            console.print(f"Total Session Time: ~{session.duration_minutes} minutes", style="yellow")
        
        # Show rest day
        console.print(f"\n🛌 SUNDAY - REST DAY", style="bold green")
        console.print("Recovery and rest are essential for muscle growth and injury prevention.", style="italic")
        console.print("Consider light activities like walking, stretching, or yoga.", style="italic")
    
    def _save_workout_plan(self, plan: WeeklyWorkoutPlan):
        """Save workout plan to file with improved error handling and backup support"""
        try:
            # Create backup before saving
            self._create_backup(self.plans_file)
            
            # Ensure directory exists
            os.makedirs(os.path.dirname(self.plans_file), exist_ok=True)
            
            # Load existing plans
            plans = {}
            if os.path.exists(self.plans_file):
                with open(self.plans_file, 'r') as f:
                    plans = json.load(f)
            
            # Add new plan
            plan_data = plan.dict()
            plan_data['week_start'] = plan.week_start.isoformat()
            for day, session in plan_data['sessions'].items():
                plan_data['sessions'][day]['date'] = session['date'].isoformat()
            
            plans[plan.user_id] = plan_data
            
            # Save back to file
            with open(self.plans_file, 'w') as f:
                json.dump(plans, f, indent=2)
            
            console.print("✅ Workout plan saved successfully!", style="green")
            
        except PermissionError:
            console.print("❌ Permission denied when saving workout plan. Check file permissions.", style="red")
        except Exception as e:
            console.print(f"❌ Error saving workout plan: {e}", style="red")
    
    def load_workout_plan(self, user_id: str) -> Optional[WeeklyWorkoutPlan]:
        """Load a user's workout plan from file with improved error handling"""
        try:
            if os.path.exists(self.plans_file):
                with open(self.plans_file, 'r') as f:
                    data = json.load(f)
                    if user_id in data:
                        plan_data = data[user_id]
                        # Convert datetime strings back to datetime objects
                        plan_data['week_start'] = datetime.fromisoformat(plan_data['week_start'])
                        for session_data in plan_data['sessions'].values():
                            session_data['date'] = datetime.fromisoformat(session_data['date'])
                        return WeeklyWorkoutPlan(**plan_data)
        except json.JSONDecodeError as e:
            console.print(f"❌ Corrupted workout plans file: {e}", style="red")
        except Exception as e:
            console.print(f"❌ Error loading workout plan: {e}", style="red")
        return None
    
    def customize_workout_plan(self, user: User, plan: WeeklyWorkoutPlan):
        """Allow user to customize their workout plan"""
        console.print("\n" + "="*30)
        console.print("⚙️  CUSTOMIZE WORKOUT PLAN", style="bold blue")
        console.print("="*30)
        
        while True:
            console.print("\nCustomization Options:")
            console.print("1. 📅 Change workout days")
            console.print("2. 🏃‍♂️ Modify exercises")
            console.print("3. 📊 Adjust sets/reps")
            console.print("4. ⬅️  Back to main menu")
            
            choice = Prompt.ask("Select option", choices=["1", "2", "3", "4"])
            
            if choice == "1":
                self._customize_workout_days(plan)
            elif choice == "2":
                self._customize_exercises(user, plan)
            elif choice == "3":
                self._customize_sets_reps(plan)
            elif choice == "4":
                break
        
        # Save updated plan
        self._save_workout_plan(plan)
        console.print("✅ Workout plan updated!", style="green")
    
    def _customize_workout_days(self, plan: WeeklyWorkoutPlan):
        """Customize which days to workout"""
        console.print("\nCurrent workout days:")
        for day in plan.sessions.keys():
            console.print(f"• {day.title()}")
        
        if Confirm.ask("Would you like to change workout days?"):
            # This would involve more complex logic to redistribute exercises
            console.print("🔄 Workout day customization coming soon!", style="yellow")
    
    def _customize_exercises(self, user: User, plan: WeeklyWorkoutPlan):
        """Customize exercises in the plan"""
        console.print("\nExercise customization coming soon!", style="yellow")
    
    def _customize_sets_reps(self, plan: WeeklyWorkoutPlan):
        """Customize sets and reps"""
        console.print("\nSets/reps customization coming soon!", style="yellow")
