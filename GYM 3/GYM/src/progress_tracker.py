"""
Progress Tracking Module
Handles workout tracking, progress monitoring, and level advancement
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
from rich.progress import Progress, BarColumn, TextColumn, TimeElapsedColumn
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np

from pydantic import BaseModel
from src.user_manager import User, UserManager
from src.workout_planner import WeeklyWorkoutPlan, WorkoutSession
from src.fitness_assessor import FitnessAssessor
from src.realtime_guidance import RealtimeCoach
from src.nutrition_tracker import NutritionTracker

console = Console()

class WorkoutLog(BaseModel):
    """Individual workout log entry"""
    date: datetime
    session_name: str
    exercises_completed: List[Dict]
    total_duration: int  # minutes
    calories_burned: float
    notes: str = ""
    difficulty_rating: int = 5  # 1-10 scale
    completion_percentage: float = 0.0

class FatigueTracker(BaseModel):
    """Tracks user fatigue and performance across exercises"""
    current_fatigue_level: float = 0.0  # 0.0 to 1.0
    performance_trend: List[float] = []  # Recent performance percentages
    exercise_difficulty_scores: List[float] = []  # Difficulty of completed exercises
    total_volume_completed: int = 0  # Total reps completed
    time_elapsed: int = 0  # Minutes elapsed
    struggling_exercises: List[str] = []  # Names of exercises where user struggled
    
    def calculate_fatigue_impact(self) -> float:
        """Calculate how much fatigue should affect subsequent exercises"""
        if not self.performance_trend:
            return 0.0
        
        # Recent performance trend (last 3 exercises)
        recent_performance = np.mean(self.performance_trend[-3:]) if len(self.performance_trend) >= 3 else np.mean(self.performance_trend)
        
        # Volume impact (more reps = more fatigue)
        volume_impact = min(0.3, self.total_volume_completed / 100.0)
        
        # Time impact (longer workout = more fatigue)
        time_impact = min(0.2, self.time_elapsed / 60.0)
        
        # Struggling exercises impact
        struggle_impact = len(self.struggling_exercises) * 0.1
        
        # Performance decline impact
        if len(self.performance_trend) >= 2:
            performance_decline = max(0, self.performance_trend[-2] - self.performance_trend[-1])
            decline_impact = performance_decline * 0.5
        else:
            decline_impact = 0.0
        
        # Convert performance percentage to fatigue (100% = 0 fatigue, 0% = 1 fatigue)
        performance_fatigue = (100.0 - float(recent_performance)) / 100.0
        
        total_fatigue = performance_fatigue * 0.4 + volume_impact + time_impact + struggle_impact + decline_impact
        return float(min(1.0, max(0.0, total_fatigue)))

class AdaptiveWorkoutManager:
    """Manages adaptive workout intensity and difficulty scaling"""
    
    def __init__(self):
        self.fatigue_tracker = FatigueTracker()
        self.original_targets = {}  # Store original exercise targets
        self.adaptation_history = []  # Track adaptations made
    
    def reset_for_new_workout(self):
        """Reset tracker for new workout session"""
        self.fatigue_tracker = FatigueTracker()
        self.original_targets = {}
        self.adaptation_history = []
    
    def set_original_targets(self, exercises: List[Dict]):
        """Store original exercise targets for reference"""
        for i, exercise in enumerate(exercises):
            self.original_targets[i] = {
                'name': exercise['name'],
                'sets': exercise['sets'],
                'reps': exercise['reps'],
                'body_parts': exercise.get('body_parts', [])
            }
    
    def update_performance(self, exercise_index: int, actual_reps: int, target_reps: int, 
                          exercise_name: str, time_elapsed: int):
        """Update fatigue tracker with exercise performance"""
        performance_percentage = (actual_reps / target_reps) * 100 if target_reps > 0 else 0
        
        # Update performance trend
        self.fatigue_tracker.performance_trend.append(performance_percentage)
        
        # Update volume
        self.fatigue_tracker.total_volume_completed += actual_reps
        
        # Update time
        self.fatigue_tracker.time_elapsed = time_elapsed
        
        # Track struggling exercises
        if performance_percentage < 70:  # Less than 70% of target
            if exercise_name not in self.fatigue_tracker.struggling_exercises:
                self.fatigue_tracker.struggling_exercises.append(exercise_name)
        
        # Calculate new fatigue level
        self.fatigue_tracker.current_fatigue_level = self.fatigue_tracker.calculate_fatigue_impact()
    
    def get_adaptive_targets(self, exercise_index: int, exercise: Dict) -> Tuple[int, int]:
        """Get adapted sets and reps based on current fatigue and performance"""
        if exercise_index not in self.original_targets:
            return exercise['sets'], exercise['reps']
        
        original = self.original_targets[exercise_index]
        fatigue_level = self.fatigue_tracker.current_fatigue_level

        # Strict guard: Only adapt if user previously failed to hit target
        # i.e., we have at least one performance entry < 100% or a recorded struggle
        has_struggled = bool(self.fatigue_tracker.struggling_exercises)
        last_perf = self.fatigue_tracker.performance_trend[-1] if self.fatigue_tracker.performance_trend else None
        if not has_struggled and (last_perf is None or last_perf >= 100.0):
            # Do not proactively reduce targets; keep original until a struggle occurs
            return original['sets'], original['reps']
        
        # Base adaptation factors
        sets_reduction = 0
        reps_reduction = 0
        
        # High fatigue (0.7+) - significant reduction
        if fatigue_level >= 0.7:
            sets_reduction = 1 if original['sets'] > 2 else 0
            reps_reduction = max(2, int(original['reps'] * 0.3))
        
        # Medium fatigue (0.4-0.7) - moderate reduction
        elif fatigue_level >= 0.4:
            reps_reduction = max(1, int(original['reps'] * 0.2))
        
        # Low fatigue (0.2-0.4) - slight reduction
        elif fatigue_level >= 0.2:
            reps_reduction = max(1, int(original['reps'] * 0.1))
        
        # Body part specific adaptations
        body_parts = exercise.get('body_parts', [])
        if 'legs' in body_parts and fatigue_level > 0.3:
            reps_reduction += 1  # Legs are more affected by fatigue
        if 'core' in body_parts and fatigue_level > 0.4:
            reps_reduction += 1  # Core exercises are more affected
        
        # Calculate final targets
        adapted_sets = max(1, original['sets'] - sets_reduction)
        adapted_reps = max(1, original['reps'] - reps_reduction)
        
        # Store adaptation for tracking
        adaptation = {
            'exercise_index': exercise_index,
            'exercise_name': exercise['name'],
            'original_sets': original['sets'],
            'original_reps': original['reps'],
            'adapted_sets': adapted_sets,
            'adapted_reps': adapted_reps,
            'fatigue_level': fatigue_level,
            'reason': self._get_adaptation_reason(fatigue_level, body_parts)
        }
        self.adaptation_history.append(adaptation)
        
        return adapted_sets, adapted_reps
    
    def _get_adaptation_reason(self, fatigue_level: float, body_parts: List[str]) -> str:
        """Get human-readable reason for adaptation"""
        if fatigue_level >= 0.7:
            return "High fatigue detected - significant reduction"
        elif fatigue_level >= 0.4:
            return "Moderate fatigue - moderate reduction"
        elif fatigue_level >= 0.2:
            return "Low fatigue - slight reduction"
        elif 'legs' in body_parts:
            return "Leg exercise - fatigue-sensitive reduction"
        elif 'core' in body_parts:
            return "Core exercise - fatigue-sensitive reduction"
        else:
            return "No adaptation needed"
    
    def get_fatigue_summary(self) -> Dict:
        """Get summary of current fatigue state"""
        return {
            'fatigue_level': self.fatigue_tracker.current_fatigue_level,
            'performance_trend': self.fatigue_tracker.performance_trend[-5:] if self.fatigue_tracker.performance_trend else [],
            'total_volume': self.fatigue_tracker.total_volume_completed,
            'time_elapsed': self.fatigue_tracker.time_elapsed,
            'struggling_exercises': self.fatigue_tracker.struggling_exercises,
            'adaptations_made': len(self.adaptation_history)
        }

class ProgressTracker:
    """Tracks workout progress and manages level advancement"""
    
    def __init__(self):
        self.logs_file = "data/workout_logs.json"
        self.user_manager = UserManager()
        self.fitness_assessor = FitnessAssessor()
        self.realtime = RealtimeCoach()
        self.adaptive_manager = AdaptiveWorkoutManager()
        self._ensure_data_directory()
        self.in_progress_dir = "data/in_progress"
        self.backup_dir = "data/backup"
        os.makedirs(self.in_progress_dir, exist_ok=True)
        os.makedirs(self.backup_dir, exist_ok=True)
    
    def _ensure_data_directory(self):
        """Ensure data directory exists"""
        os.makedirs(os.path.dirname(self.logs_file), exist_ok=True)
    
    def _create_backup(self, file_path: str) -> bool:
        """Create a backup of a data file"""
        try:
            if not os.path.exists(file_path):
                return True  # No file to backup
                
            # Create timestamped backup
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = os.path.basename(file_path)
            backup_path = os.path.join(self.backup_dir, f"{filename}.{timestamp}.bak")
            
            # Copy file
            import shutil
            shutil.copy2(file_path, backup_path)
            
            # Keep only last 5 backups
            self._cleanup_old_backups(file_path)
            
            console.print(f"💾 Backup created: {backup_path}", style="dim")
            return True
        except Exception as e:
            console.print(f"⚠️  Failed to create backup: {e}", style="yellow")
            return False
    
    def _cleanup_old_backups(self, file_path: str):
        """Keep only the 5 most recent backups"""
        try:
            filename = os.path.basename(file_path)
            backup_pattern = f"{filename}.*.bak"
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
    
    def _now(self) -> datetime:
        return datetime.now()

    def _today(self):
        return self._now().date()
    
    def track_workout(self, user: User):
        """Main workout tracking interface"""
        console.print("\n" + "="*50)
        console.print("📈 WORKOUT TRACKING", style="bold blue")
        console.print("="*50)
        
        # Load user's workout plan
        from src.workout_planner import WorkoutPlanner
        planner = WorkoutPlanner()
        plan = planner.load_workout_plan(user.id)
        
        if not plan:
            console.print("❌ No workout plan found. Please create one first.", style="red")
            return
        
        # Check if today's workout is already completed
        today = self._now().strftime("%A").lower()
        if today in plan.sessions:
            session = plan.sessions[today]
            
            # Check if workout was already completed today
            if self._is_workout_completed_today(user.id, today):
                self._show_completed_workout_options(user, session, plan)
                return
            
            # Check if there's an in-progress session to resume
            resume_state = self._load_in_progress(user.id)
            if resume_state and Confirm.ask("Found an in-progress workout. Continue where you left off?"):
                self._start_workout_session(user, session, plan, use_camera=False, resume_state=resume_state)
                return

            # Ask about using camera guidance (always prompt so user knows why it won't start)
            use_camera = False
            console.print("\n🎥 Real-Time Guidance (camera + rep count)", style="yellow")
            if Confirm.ask("Enable camera guidance?"):
                ok = self.realtime.request_camera_access()
                if ok:
                    use_camera = True
                else:
                    console.print("❌ Camera not ready or permission denied. Using manual input.")
            self._start_workout_session(user, session, plan, use_camera)
        else:
            if today == "sunday":
                console.print("📅 Sunday is a planned rest day. No workout scheduled.", style="yellow")
                return
            console.print(f"📅 No workout scheduled for {today.title()}", style="yellow")
            if Confirm.ask("Would you like to do an ad-hoc workout?"):
                self._ad_hoc_workout(user)
    
    def _start_workout_session(self, user: User, session: WorkoutSession, plan: WeeklyWorkoutPlan, use_camera: bool = False, resume_state: Optional[Dict] = None):
        """Start a scheduled workout session"""
        console.print(f"\n🏃‍♂️ Today's Workout: {session.date.strftime('%A, %B %d')}", style="bold green")
        
        # Check if nutrition has already been logged for today
        nutrition_tracker = NutritionTracker()
        today = datetime.now().date().isoformat()
        nutrition_logged_key = f"nutrition_logged_{today}"
        
        # Check if we've already asked about nutrition today
        if not hasattr(user, '_nutrition_checked_today') or not getattr(user, '_nutrition_checked_today', False):
            # Ask about nutrition before workout
            self._perform_nutrition_checkin(user, nutrition_tracker)
            # Mark that we've checked nutrition today
            user._nutrition_checked_today = True
        
        # Display session overview
        table = Table(show_header=True, header_style="bold magenta")
        table.add_column("Exercise", style="cyan")
        table.add_column("Sets", justify="center")
        table.add_column("Reps", justify="center")
        table.add_column("Target", justify="center")
        
        for exercise in session.exercises:
            # Render reps as seconds for time-based exercises
            is_time_based_preview = self._is_time_based_exercise(exercise)
            reps_display = f"{exercise['reps']}s" if is_time_based_preview else str(exercise["reps"])
            target_display = f"{exercise['sets']}x{exercise['reps']}s" if is_time_based_preview else f"{exercise['sets']}x{exercise['reps']}"
            table.add_row(
                exercise["name"],
                str(exercise["sets"]),
                reps_display,
                target_display
            )
        
        console.print(table)
        console.print(f"Estimated Duration: {session.duration_minutes} minutes", style="yellow")
        
        if not Confirm.ask("Ready to start this workout?"):
            return
        
        # Start workout tracking
        self._execute_workout_session(user, session, plan, use_camera, resume_state)
    
    def _execute_workout_session(self, user: User, session: WorkoutSession, plan: WeeklyWorkoutPlan, use_camera: bool, resume_state: Optional[Dict]):
        """Execute and track a workout session with adaptive intensity scaling"""
        console.print("\n🚀 Starting Workout Session!", style="bold green")
        
        start_time = self._now()
        completed_exercises = []
        # Resume indices and prior sets if provided
        start_ex_idx = 0
        start_set_idx = 0
        if resume_state:
            start_ex_idx = resume_state.get("exercise_index", 0)
            start_set_idx = resume_state.get("set_index", 0)
            completed_exercises = resume_state.get("completed_exercises", [])
        total_calories = 0.0
        
        # Initialize adaptive workout manager
        self.adaptive_manager.reset_for_new_workout()
        self.adaptive_manager.set_original_targets(session.exercises)
        
        # Track each exercise
        # If camera is available but not enabled, offer a final chance to enable before sets
        if not use_camera and self.realtime.available():
            console.print("\n🎥 Camera guidance available.", style="yellow")
            if Confirm.ask("Enable camera guidance now?"):
                if self.realtime.request_camera_access():
                    use_camera = True
                else:
                    console.print("Proceeding without camera guidance.")
        
        for i, exercise in enumerate(session.exercises, 1):
            if i-1 < start_ex_idx:
                continue
            
            # Get adaptive targets based on fatigue and performance
            adapted_sets, adapted_reps = self.adaptive_manager.get_adaptive_targets(i-1, exercise)
            is_time_based = self._is_time_based_exercise(exercise)
            
            # Show fatigue status and adaptations
            fatigue_summary = self.adaptive_manager.get_fatigue_summary()
            if fatigue_summary['fatigue_level'] > 0.1:  # Only show if there's some fatigue
                self._show_fatigue_status(fatigue_summary, adapted_sets, adapted_reps, exercise)
            
            console.print(f"\n📋 Exercise {i}/{len(session.exercises)}: {exercise['name']}", style="bold blue")
            
            console.print(f"\n📋 Exercise {i}/{len(session.exercises)}: {exercise['name']}", style="bold blue")
            
            # Show original vs adapted targets (seconds for time-based)
            if adapted_sets != exercise['sets'] or adapted_reps != exercise['reps']:
                if is_time_based:
                    console.print(f"🎯 Original: {exercise['sets']} sets x {exercise['reps']}s", style="dim")
                    console.print(f"🎯 Adapted: {adapted_sets} sets x {adapted_reps}s", style="yellow")
                else:
                    console.print(f"🎯 Original: {exercise['sets']} sets x {exercise['reps']} reps", style="dim")
                    console.print(f"🎯 Adapted: {adapted_sets} sets x {adapted_reps} reps", style="yellow")
            else:
                if is_time_based:
                    console.print(f"🎯 Target: {adapted_sets} sets x {adapted_reps}s", style="yellow")
                else:
                    console.print(f"🎯 Target: {adapted_sets} sets x {adapted_reps} reps", style="yellow")
            
            # Show instructions
            if exercise.get('instructions'):
                console.print("\n📖 Instructions:")
                for j, instruction in enumerate(exercise['instructions'], 1):
                    console.print(f"{j}. {instruction}")
            
            # Track sets with adapted targets
            exercise_log = {
                "name": exercise["name"],
                "target_sets": adapted_sets,
                "target_reps": adapted_reps,
                "original_sets": exercise["sets"],
                "original_reps": exercise["reps"],
                "completed_sets": [],
                "total_reps_completed": 0,
                "calories_burned": 0.0,
                "set_durations": [],  # seconds per set
                "rest_durations": [],  # seconds between sets
                "set_calories": [],
                "metric": "reps",  # or "seconds" for time-based exercises
                "total_time_seconds": 0,
                "adaptation_applied": adapted_sets != exercise["sets"] or adapted_reps != exercise["reps"]
            }
            
            for set_num in range(adapted_sets):
                if i-1 == start_ex_idx and set_num < start_set_idx:
                    continue
                console.print(f"\n🔄 Set {set_num + 1}/{adapted_sets}")
                
                # Auto-start camera guidance if enabled
                if use_camera and self.realtime.available():
                    console.print("🎬 Starting camera. Say 'start' to begin; 'stop' to end set.")
                    counted, _, elapsed = self.realtime.perform_set(exercise, adapted_reps)
                    # Check if camera guidance was actually used
                    if counted == 0 and elapsed == 0:
                        # Camera guidance failed, fall back to manual input
                        console.print("⚠️  Camera guidance unavailable. Switching to manual input.", style="yellow")
                        if is_time_based:
                            actual_reps = IntPrompt.ask("How many seconds did you hold?", default=adapted_reps)
                            set_elapsed = int(actual_reps)
                        else:
                            actual_reps = IntPrompt.ask("How many reps did you complete?", default=adapted_reps) 
                            set_elapsed = max(30, int(adapted_reps) * 3)
                    else:
                        actual_reps = counted if counted > 0 else adapted_reps
                        set_elapsed = elapsed if elapsed > 0 else (adapted_reps if is_time_based else max(30, int(adapted_reps) * 3))
                else:
                    if is_time_based:
                        actual_reps = IntPrompt.ask("How many seconds did you hold?", default=adapted_reps)
                        set_elapsed = int(actual_reps)
                    else:
                        actual_reps = IntPrompt.ask("How many reps did you complete?", default=adapted_reps) 
                        set_elapsed = max(30, int(adapted_reps) * 3)
                
                # Determine if this exercise is time-based (e.g., Plank)
                if is_time_based:
                    exercise_log["metric"] = "seconds"
                    # For time-based, we treat 'actual_reps' from camera as seconds when camera returns time; if manual, base on elapsed
                    seconds_done = int(set_elapsed)
                    exercise_log["completed_sets"].append(seconds_done)
                    exercise_log["total_time_seconds"] += seconds_done
                else:
                    exercise_log["completed_sets"].append(actual_reps)
                    exercise_log["total_reps_completed"] += actual_reps
                
                # Calculate calories for this set (rough estimate)
                set_minutes = max(1, int(set_elapsed / 60))
                calories = exercise["calories_per_minute"] * set_minutes * (user.current_weight / 70)
                exercise_log["calories_burned"] += calories
                exercise_log["set_durations"].append(set_elapsed)
                exercise_log["set_calories"].append(calories)
                total_calories += calories
                
                # Update adaptive manager with performance
                time_elapsed = int((self._now() - start_time).total_seconds() / 60)
                self.adaptive_manager.update_performance(
                    i-1, actual_reps, adapted_reps, exercise['name'], time_elapsed
                )
                
                # Check if user is struggling (with adapted targets)
                # For time-based, compare seconds_done vs adapted_reps (seconds target)
                compare_value = seconds_done if is_time_based else actual_reps  # type: ignore
                if compare_value < adapted_reps * 0.7:  # Less than 70% of adapted target
                    msg_unit = "seconds" if is_time_based else "reps"
                    console.print(f"⚠️  You're struggling with this exercise. Consider reducing {msg_unit} for remaining sets.", style="yellow")
                    if Confirm.ask("Reduce target reps for remaining sets?"):
                        new_target = max(1, compare_value)
                        adapted_reps = new_target
                        exercise_log["target_reps"] = new_target
                        console.print(f"✅ Target reduced to {new_target} {msg_unit}", style="green")
                
                # Save in-progress state after each set
                self._save_in_progress(user.id, i-1, set_num+1, completed_exercises + [exercise_log])

                # Rest gate without auto-timing; wait for explicit 'start'
                if set_num < adapted_sets - 1:  # Not the last set
                    rest_start = self._now()
                    # Check if camera is actually available and working
                    camera_working = use_camera and self.realtime.available() and self.realtime.test_camera_access()
                    if camera_working:
                        console.print("⏱️  Set completed! Rest starting in 5 seconds...", style="italic")
                        console.print("⌨️  Press 'S' to skip rest or any key to continue resting", style="dim")
                        
                        # 5-second countdown with skip option
                        try:
                            import select
                            import sys
                            import time as time_module
                            
                            # Wait for input or timeout
                            start_wait = time_module.time()
                            skip_rest = False
                            while time_module.time() - start_wait < 5:
                                if select.select([sys.stdin], [], [], 0) == ([sys.stdin], [], []):
                                    # Input available - check if it's 's' or 'S' to skip
                                    try:
                                        # Non-blocking read
                                        import termios, tty
                                        old_settings = termios.tcgetattr(sys.stdin)
                                        try:
                                            tty.setraw(sys.stdin.fileno())
                                            ch = sys.stdin.read(1)
                                            if ch.lower() == 's':
                                                skip_rest = True
                                        finally:
                                            termios.tcsetattr(sys.stdin, termios.TCSADRAIN, old_settings)
                                    except:
                                        # Fallback
                                        input()
                                        skip_rest = True
                                    break
                                time_module.sleep(0.1)
                            
                            if skip_rest:
                                console.print("⏭️  Skipping rest period...", style="green")
                            else:
                                console.print("🔄 Rest period starting now...", style="blue")
                                # Wait for user to start next set
                                console.print("📣 Say 'start' or press any key to begin next set")
                                input()
                        except:
                            # Fallback for platforms that don't support advanced input handling
                            console.print("⏱️  Rest. Say 'start' to begin the next set.", style="italic")
                            input("Press Enter to continue to next set...")
                    else:
                        skip_rest = Confirm.ask("Skip rest period and continue immediately?", default=False)
                        if not skip_rest:
                            input("Press Enter when ready for next set...")
                    rest_duration = (self._now() - rest_start).total_seconds()
                    exercise_log["rest_durations"].append(rest_duration)
            
            completed_exercises.append(exercise_log)

            # Between exercises, capture inter-exercise rest time and gate next start
            if i < len(session.exercises):
                between_rest_start = self._now()
                # Check if camera is actually available and working
                camera_working = use_camera and self.realtime.available() and self.realtime.test_camera_access()
                if camera_working:
                    console.print("✅ Exercise completed! Next exercise starting in 5 seconds...", style="italic")
                    console.print("⌨️  Press 'S' to skip or any key to continue resting", style="dim")
                    
                    # 5-second countdown with skip option
                    try:
                        import select
                        import sys
                        import time as time_module
                        
                        # Wait for input or timeout
                        start_wait = time_module.time()
                        skip_rest = False
                        while time_module.time() - start_wait < 5:
                            if select.select([sys.stdin], [], [], 0) == ([sys.stdin], [], []):
                                # Input available - check if it's 's' or 'S' to skip
                                try:
                                    # Non-blocking read
                                    import termios, tty
                                    old_settings = termios.tcgetattr(sys.stdin)
                                    try:
                                        tty.setraw(sys.stdin.fileno())
                                        ch = sys.stdin.read(1)
                                        if ch.lower() == 's':
                                            skip_rest = True
                                    finally:
                                        termios.tcsetattr(sys.stdin, termios.TCSADRAIN, old_settings)
                                except:
                                    # Fallback
                                    input()
                                    skip_rest = True
                                break
                            time_module.sleep(0.1)
                        
                        if skip_rest:
                            console.print("⏭️  Skipping rest period...", style="green")
                        else:
                            console.print("🔄 Rest period starting now...", style="blue")
                            # Wait for user to start next exercise
                            console.print("📣 Say 'start' or press any key to begin next exercise")
                            input()
                    except:
                        # Fallback for platforms that don't support advanced input handling
                        console.print("📣 Say 'start' to begin the next exercise.")
                        input("Press Enter to continue to next exercise...")
                else:
                    skip_rest = Confirm.ask("Skip rest period and continue immediately?", default=False)
                    if not skip_rest:
                        input("Press Enter when ready for next exercise...")
                between_rest_seconds = (self._now() - between_rest_start).total_seconds()
                # Store on last exercise log as 'post_exercise_rest' for accurate timeline
                exercise_log.setdefault("post_exercise_rest", 0.0)
                exercise_log["post_exercise_rest"] += between_rest_seconds
            
            # Show tips after exercise
            if exercise.get('tips'):
                console.print("\n💡 Tips:")
                for tip in exercise['tips']:
                    console.print(f"• {tip}")
        
        # End of workout
        end_time = self._now()
        duration = int((end_time - start_time).total_seconds() / 60)
        
        console.print("\n🎉 Workout Complete!", style="bold green")
        console.print(f"⏱️  Duration: {duration} minutes")
        console.print(f"🔥 Calories Burned: {total_calories:.1f}")
        
        # Show adaptation summary
        self._show_adaptation_summary()
        
        # Get user feedback
        difficulty = IntPrompt.ask("Rate workout difficulty (1-10)", default=5)
        notes = Prompt.ask("Any notes about this workout?", default="")
        
        # Create workout log
        workout_log = WorkoutLog(
            date=start_time,
            session_name=f"Workout - {start_time.strftime('%A')}",
            exercises_completed=completed_exercises,
            total_duration=duration,
            calories_burned=total_calories,
            notes=notes,
            difficulty_rating=difficulty,
            completion_percentage=self._calculate_completion_percentage(completed_exercises, session.exercises)
        )
        
        # Save workout log
        self._save_workout_log(user.id, workout_log)

        # Clear in-progress state
        self._clear_in_progress(user.id)
        
        # Update user stats
        self._update_user_stats(user, workout_log)
        
        # Check for weekly level adjustment using progress
        self._check_weekly_progress_level_adjust(user)
        
        # Show progress summary
        self._show_workout_summary(workout_log)
    
    def _show_fatigue_status(self, fatigue_summary: Dict, adapted_sets: int, adapted_reps: int, exercise: Dict):
        """Show current fatigue status and adaptations"""
        fatigue_level = fatigue_summary['fatigue_level']
        performance_trend = fatigue_summary['performance_trend']
        adaptations_made = fatigue_summary['adaptations_made']
        
        # Determine fatigue level description
        if fatigue_level >= 0.7:
            fatigue_desc = "High Fatigue"
            color = "red"
        elif fatigue_level >= 0.4:
            fatigue_desc = "Moderate Fatigue"
            color = "yellow"
        elif fatigue_level >= 0.2:
            fatigue_desc = "Low Fatigue"
            color = "blue"
        else:
            fatigue_desc = "Fresh"
            color = "green"
        
        console.print(f"\n💪 Fatigue Status: {fatigue_desc} ({fatigue_level:.1%})", style=color)
        
        if performance_trend:
            avg_performance = np.mean(performance_trend[-3:]) if len(performance_trend) >= 3 else np.mean(performance_trend)
            console.print(f"📊 Recent Performance: {avg_performance:.1f}%", style="dim")
        
        if adaptations_made > 0:
            console.print(f"🔄 Adaptations Made: {adaptations_made}", style="yellow")
            
            # Show specific adaptation for current exercise
            if adapted_sets != exercise['sets'] or adapted_reps != exercise['reps']:
                console.print(f"   • {exercise['name']}: {exercise['sets']}x{exercise['reps']} → {adapted_sets}x{adapted_reps}", style="yellow")
    
    def _show_adaptation_summary(self):
        """Show summary of all adaptations made during workout"""
        if not self.adaptive_manager.adaptation_history:
            return
        
        console.print("\n📈 Workout Adaptations Summary", style="bold blue")
        console.print("="*40)
        
        total_adaptations = len(self.adaptive_manager.adaptation_history)
        console.print(f"Total Adaptations: {total_adaptations}", style="yellow")
        
        # Group adaptations by reason
        adaptations_by_reason = {}
        for adaptation in self.adaptive_manager.adaptation_history:
            reason = adaptation['reason']
            if reason not in adaptations_by_reason:
                adaptations_by_reason[reason] = []
            adaptations_by_reason[reason].append(adaptation)
        
        for reason, adaptations in adaptations_by_reason.items():
            console.print(f"\n• {reason}: {len(adaptations)} exercise(s)", style="dim")
            for adaptation in adaptations:
                console.print(f"  - {adaptation['exercise_name']}: {adaptation['original_sets']}x{adaptation['original_reps']} → {adaptation['adapted_sets']}x{adaptation['adapted_reps']}", style="dim")
        
        # Show fatigue progression
        fatigue_summary = self.adaptive_manager.get_fatigue_summary()
        if fatigue_summary['fatigue_level'] > 0:
            console.print(f"\n💪 Final Fatigue Level: {fatigue_summary['fatigue_level']:.1%}", style="blue")
            console.print(f"📊 Total Volume: {fatigue_summary['total_volume']} reps", style="blue")
            console.print(f"⏱️  Time Elapsed: {fatigue_summary['time_elapsed']} minutes", style="blue")
    
    def _calculate_completion_percentage(self, completed_exercises: List[Dict], target_exercises: List[Dict]) -> float:
        """Calculate completion percentage of workout"""
        if not target_exercises:
            return 0.0
        
        total_completion = 0.0
        for i, exercise in enumerate(target_exercises):
            if i < len(completed_exercises):
                completed = completed_exercises[i]
                # Determine if this target exercise is time-based
                is_time_based_target = self._is_time_based_exercise(exercise)
                target_units = int(exercise.get("sets", 0)) * int(exercise.get("reps", 0))
                # Use appropriate actual metric based on how the set was logged
                if completed.get("metric") == "seconds" or is_time_based_target:
                    actual_units = int(completed.get("total_time_seconds", 0))
                else:
                    actual_units = int(completed.get("total_reps_completed", 0))
                exercise_completion = min(100.0, (actual_units / target_units) * 100) if target_units > 0 else 0.0
                total_completion += exercise_completion
            else:
                # Not completed at all
                total_completion += 0.0
        
        return total_completion / len(target_exercises)

    def _save_in_progress(self, user_id: str, exercise_index: int, set_index: int, completed_exercises: List[Dict]):
        """Save in-progress workout state with improved error handling and data validation"""
        try:
            # Validate inputs
            if not user_id or exercise_index < 0 or set_index < 0:
                console.print("⚠️  Invalid in-progress state data. Skipping save.", style="yellow")
                return
                
            state = {
                "date": self._now().strftime("%Y-%m-%d"),
                "exercise_index": exercise_index,
                "set_index": set_index,
                "completed_exercises": completed_exercises,
                "timestamp": self._now().isoformat()  # Add timestamp for debugging
            }
            
            # Ensure directory exists
            os.makedirs(self.in_progress_dir, exist_ok=True)
            
            path = os.path.join(self.in_progress_dir, f"{user_id}_{state['date']}.json")
            
            # Validate completed_exercises structure
            validated_exercises = []
            for exercise in completed_exercises:
                # Ensure required fields exist
                validated_exercise = {
                    "name": exercise.get("name", "Unknown Exercise"),
                    "target_sets": max(1, exercise.get("target_sets", 1)),
                    "target_reps": max(1, exercise.get("target_reps", 1)),
                    "original_sets": max(1, exercise.get("original_sets", 1)),
                    "original_reps": max(1, exercise.get("original_reps", 1)),
                    "completed_sets": exercise.get("completed_sets", []),
                    "total_reps_completed": max(0, exercise.get("total_reps_completed", 0)),
                    "calories_burned": max(0.0, exercise.get("calories_burned", 0.0)),
                    "set_durations": exercise.get("set_durations", []),
                    "rest_durations": exercise.get("rest_durations", []),
                    "set_calories": exercise.get("set_calories", []),
                    "metric": exercise.get("metric", "reps"),
                    "total_time_seconds": max(0, exercise.get("total_time_seconds", 0)),
                    "adaptation_applied": bool(exercise.get("adaptation_applied", False))
                }
                # Add optional fields if they exist
                if "post_exercise_rest" in exercise:
                    validated_exercise["post_exercise_rest"] = max(0.0, exercise["post_exercise_rest"])
                    
                validated_exercises.append(validated_exercise)
            
            state["completed_exercises"] = validated_exercises
            
            with open(path, 'w') as f:
                json.dump(state, f, indent=2)
                
            console.print(f"💾 In-progress state saved successfully", style="dim")
            
        except Exception as e:
            console.print(f"⚠️  Failed to save in-progress state: {str(e)}", style="yellow")
            # Don't raise exception to avoid crashing the workout

    def _load_in_progress(self, user_id: str) -> Optional[Dict]:
        """Load in-progress workout state with improved error handling"""
        try:
            date = self._now().strftime("%Y-%m-%d")
            path = os.path.join(self.in_progress_dir, f"{user_id}_{date}.json")
            
            if os.path.exists(path):
                with open(path, 'r') as f:
                    state = json.load(f)
                
                # Validate state structure
                required_keys = ["exercise_index", "set_index", "completed_exercises"]
                if not all(key in state for key in required_keys):
                    console.print("⚠️  Corrupted in-progress state file. Starting fresh.", style="yellow")
                    self._clear_in_progress(user_id)  # Clean up corrupted file
                    return None
                
                # Validate exercise data
                validated_exercises = []
                for exercise in state.get("completed_exercises", []):
                    # Ensure all required fields are present with sensible defaults
                    validated_exercise = {
                        "name": str(exercise.get("name", "Unknown Exercise")),
                        "target_sets": max(1, int(exercise.get("target_sets", 1))),
                        "target_reps": max(1, int(exercise.get("target_reps", 1))),
                        "original_sets": max(1, int(exercise.get("original_sets", 1))),
                        "original_reps": max(1, int(exercise.get("original_reps", 1))),
                        "completed_sets": list(exercise.get("completed_sets", [])),
                        "total_reps_completed": max(0, int(exercise.get("total_reps_completed", 0))),
                        "calories_burned": max(0.0, float(exercise.get("calories_burned", 0.0))),
                        "set_durations": list(exercise.get("set_durations", [])),
                        "rest_durations": list(exercise.get("rest_durations", [])),
                        "set_calories": list(exercise.get("set_calories", [])),
                        "metric": str(exercise.get("metric", "reps")),
                        "total_time_seconds": max(0, int(exercise.get("total_time_seconds", 0))),
                        "adaptation_applied": bool(exercise.get("adaptation_applied", False))
                    }
                    # Add optional fields if they exist
                    if "post_exercise_rest" in exercise:
                        validated_exercise["post_exercise_rest"] = max(0.0, float(exercise["post_exercise_rest"]))
                        
                    validated_exercises.append(validated_exercise)
                
                state["completed_exercises"] = validated_exercises
                state["exercise_index"] = max(0, int(state.get("exercise_index", 0)))
                state["set_index"] = max(0, int(state.get("set_index", 0)))
                
                console.print(f"📂 In-progress state loaded successfully", style="dim")
                return state
                
            return None
        except Exception as e:
            console.print(f"⚠️  Failed to load in-progress state: {str(e)}", style="yellow")
            return None

    def _clear_in_progress(self, user_id: str):
        """Clear in-progress workout state with improved error handling"""
        try:
            date = self._now().strftime("%Y-%m-%d")
            path = os.path.join(self.in_progress_dir, f"{user_id}_{date}.json")
            if os.path.exists(path):
                os.remove(path)
                console.print(f"🗑️  In-progress state cleared", style="dim")
        except Exception as e:
            console.print(f"⚠️  Failed to clear in-progress state: {str(e)}", style="yellow")
    
    def _check_weekly_progress_level_adjust(self, user: User):
        """Adjust level based on weekly progress over the current training week.
        Only evaluate when we have the full week's data (6 training days Mon-Sat).
        Promote if weekly progress >= 95%, demote if <= 60%."""
        # Load logs in the last 10 days to comfortably include the current week
        logs = self._get_recent_workout_logs(user.id, days=10)
        if not logs:
            return

        # Determine current ISO week (Mon-Sun); training days are Mon-Sat (6 days)
        today = self._today()
        iso_year, iso_week, _ = today.isocalendar()

        # Group logs by day for the current ISO week
        by_date: Dict[str, List[Dict]] = {}
        for log in logs:
            log_dt = datetime.fromisoformat(log['date'])
            y, w, _ = log_dt.date().isocalendar()
            if (y, w) == (iso_year, iso_week):
                dkey = log_dt.date().isoformat()
                by_date.setdefault(dkey, []).append(log)

        if not by_date:
            return

        # Build ordered list for Mon-Sat only
        # Compute Monday of this ISO week
        monday = today - timedelta(days=today.weekday())
        training_days = [monday + timedelta(days=i) for i in range(6)]  # Mon..Sat

        daily_progress: List[float] = []
        for d in training_days:
            dkey = d.isoformat()
            entries = by_date.get(dkey, [])
            if not entries:
                # Missing a training day → do not evaluate yet
                return
            vals = [e.get('completion_percentage', 0.0) for e in entries]
            daily_progress.append(max(vals) if vals else 0.0)

        if len(daily_progress) < 6:
            # Not a full training week
            return

        weekly_progress = sum(daily_progress) / 6.0

        # Determine sublevel adjustment strictly based on full-week progress
        sublevel = getattr(user, 'fitness_sublevel', 1)
        level = user.fitness_level
        changed = False
        if weekly_progress >= 95.0 and sublevel < 2:
            user.fitness_sublevel = 2
            changed = True
        elif weekly_progress <= 60.0:
            if sublevel > 1:
                user.fitness_sublevel = 1
                changed = True
            else:
                # downgrade one level if possible
                order = ["beginner","intermediate","advanced","expert"]
                if level in order and order.index(level) > 0:
                    user.fitness_level = order[order.index(level)-1]
                    user.fitness_sublevel = 2
                    changed = True
        if changed:
            self.user_manager.update_user(user)
            console.print(f"🔄 Level updated based on full-week progress: {user.fitness_level.title()} {user.fitness_sublevel}", style="yellow")
    
    def _save_workout_log(self, user_id: str, workout_log):
        """Save workout log to file with backup support"""
        try:
            # Create backup before saving
            self._create_backup(self.logs_file)
            
            # Load existing logs
            logs = {}
            if os.path.exists(self.logs_file):
                with open(self.logs_file, 'r') as f:
                    logs = json.load(f)
            
            # Add new log
            if user_id not in logs:
                logs[user_id] = []
            
            # Handle both WorkoutLog objects and dictionaries
            if hasattr(workout_log, 'dict'):
                log_data = workout_log.dict()
                log_data['date'] = workout_log.date.isoformat()
            else:
                # It's already a dictionary
                log_data = workout_log.copy()
                if 'date' in log_data and isinstance(log_data['date'], datetime):
                    log_data['date'] = log_data['date'].isoformat()
            
            logs[user_id].append(log_data)
            
            # Save back to file
            with open(self.logs_file, 'w') as f:
                json.dump(logs, f, indent=2)
            
            console.print("✅ Workout logged successfully!", style="green")
            
        except Exception as e:
            console.print(f"❌ Error saving workout log: {e}", style="red")
    
    def _update_user_stats(self, user: User, workout_log: WorkoutLog):
        """Update user statistics after workout"""
        # Update workout streak
        if user.last_workout:
            days_since_last = (workout_log.date.date() - user.last_workout.date()).days
            if days_since_last == 1:
                user.workout_streak += 1
            elif days_since_last > 1:
                user.workout_streak = 1
        else:
            user.workout_streak = 1
        
        # Update other stats
        user.last_workout = workout_log.date
        user.total_workouts += 1
        user.calories_burned_total += workout_log.calories_burned
        
        # Update weekly calorie burned for nutrition tracking
        user.weekly_calorie_burned += workout_log.calories_burned
        
        # Save updated user
        self.user_manager.update_user(user)
    
    def _check_level_advancement(self, user: User):
        """Check if user should advance to next fitness level"""
        # Get recent workout logs
        recent_logs = self._get_recent_workout_logs(user.id, days=7)
        
        if len(recent_logs) < 3:  # Need at least 3 workouts in a week
            return
        
        # Calculate average completion rate
        avg_completion = sum(log["completion_percentage"] for log in recent_logs) / len(recent_logs)
        
        # Check if user consistently completes workouts well
        if avg_completion >= 90:  # 90% completion rate
            progression_info = self.fitness_assessor.suggest_level_progression(user)
            
            if progression_info["next_level"]:
                console.print(f"\n🎯 Level Progression Available!", style="bold green")
                console.print(f"Current: {progression_info['current_level'].title()}")
                console.print(f"Next: {progression_info['next_level'].title()}")
                console.print(f"Message: {progression_info['message']}")
                
                if Confirm.ask("Would you like to advance to the next level?"):
                    # Update user fitness level
                    user.fitness_level = progression_info["next_level"]
                    self.user_manager.update_user(user)
                    console.print(f"🎉 Congratulations! You're now {progression_info['next_level'].title()} level!", style="bold green")
    
    def _get_recent_workout_logs(self, user_id: str, days: int = 7) -> List[Dict]:
        """Get recent workout logs for user"""
        try:
            if not os.path.exists(self.logs_file):
                return []
            
            with open(self.logs_file, 'r') as f:
                logs = json.load(f)
            
            if user_id not in logs:
                return []
            
            # Filter logs from last N days
            cutoff_date = datetime.now() - timedelta(days=days)
            recent_logs = []
            
            for log in logs[user_id]:
                log_date = datetime.fromisoformat(log['date'])
                if log_date >= cutoff_date:
                    recent_logs.append(log)
            
            return recent_logs
            
        except Exception as e:
            console.print(f"❌ Error loading workout logs: {e}", style="red")
            return []
    
    def _show_workout_summary(self, workout_log: WorkoutLog):
        """Show summary of completed workout"""
        console.print("\n" + "="*30)
        console.print("📊 WORKOUT SUMMARY", style="bold green")
        console.print("="*30)
        
        summary_text = Text()
        summary_text.append(f"Date: {workout_log.date.strftime('%A, %B %d, %Y')}\n", style="bold")
        summary_text.append(f"Duration: {workout_log.total_duration} minutes\n")
        summary_text.append(f"Calories Burned: {workout_log.calories_burned:.1f}\n")
        summary_text.append(f"Completion: {workout_log.completion_percentage:.1f}%\n")
        summary_text.append(f"Difficulty Rating: {workout_log.difficulty_rating}/10\n")
        
        if workout_log.notes:
            summary_text.append(f"\nNotes: {workout_log.notes}\n")
        
        console.print(Panel(summary_text, title="Workout Complete", border_style="green"))
    
    def _is_workout_completed_today(self, user_id: str, day: str) -> bool:
        """Check if workout was already completed today"""
        try:
            if not os.path.exists(self.logs_file):
                return False
            with open(self.logs_file, 'r') as f:
                logs = json.load(f)
            if user_id not in logs:
                return False
            today = self._today()
            # Check if there's a workout log for today
            for log in logs[user_id]:
                log_date = datetime.fromisoformat(log['date']).date()
                if log_date == today:
                    return True
            return False
        except Exception as e:
            console.print(f"❌ Error checking workout completion: {e}", style="red")
            return False
    
    def _show_completed_workout_options(self, user: User, session: WorkoutSession, plan: WeeklyWorkoutPlan):
        """Show options when workout is already completed today"""
        console.print("\n" + "="*50)
        console.print("✅ WORKOUT ALREADY COMPLETED TODAY", style="bold green")
        console.print("="*50)
        
        # Get today's workout log
        today_log = self._get_todays_workout_log(user.id)
        
        if today_log:
            console.print(f"🎉 Great job! You completed today's workout.", style="green")
            console.print(f"⏱️  Duration: {today_log['total_duration']} minutes")
            console.print(f"🔥 Calories Burned: {today_log['calories_burned']:.1f}")
            console.print(f"📊 Completion: {today_log['completion_percentage']:.1f}%")
            console.print(f"⭐ Difficulty Rating: {today_log['difficulty_rating']}/10")
            
            if today_log.get('notes'):
                console.print(f"📝 Notes: {today_log['notes']}")
        
        console.print("\nWhat would you like to do?")
        console.print("1. 📊 View today's workout details")
        console.print("2. 📈 View progress reports")
        console.print("3. 🏃‍♂️ Do an additional workout (not recommended)")
        console.print("4. ⬅️  Back to main menu")
        
        choice = Prompt.ask("Select an option", choices=["1", "2", "3", "4"])
        
        if choice == "1":
            self._show_todays_workout_details(today_log)  # type: ignore
        elif choice == "2":
            self.show_progress_reports(user)
        elif choice == "3":
            if Confirm.ask("⚠️  Are you sure you want to do another workout today? This is not recommended for recovery."):
                self._additional_workout_warning(user)
        elif choice == "4":
            return
    
    def _get_todays_workout_log(self, user_id: str) -> Optional[Dict]:
        """Get today's workout log"""
        try:
            if not os.path.exists(self.logs_file):
                return None
            with open(self.logs_file, 'r') as f:
                logs = json.load(f)
            if user_id not in logs:
                return None
            today = self._today()
            # Find today's workout log
            for log in logs[user_id]:
                log_date = datetime.fromisoformat(log['date']).date()
                if log_date == today:
                    return log
            return None
        except Exception as e:
            console.print(f"❌ Error getting today's workout log: {e}", style="red")
            return None
    
    def _show_todays_workout_details(self, workout_log: Dict):
        """Show detailed breakdown of today's workout"""
        if not workout_log:
            console.print("❌ No workout details found", style="red")
            return
        
        console.print("\n" + "="*50)
        console.print("📋 TODAY'S WORKOUT DETAILS", style="bold blue")
        console.print("="*50)
        
        # Show exercise breakdown
        table = Table(show_header=True, header_style="bold magenta")
        table.add_column("Exercise", style="cyan")
        table.add_column("Sets Completed", justify="center")
        table.add_column("Total", justify="center")
        table.add_column("Calories", justify="center")
        
        for exercise in workout_log.get('exercises_completed', []):
            if exercise.get('metric') == 'seconds':
                total_units = f"{int(exercise.get('total_time_seconds', 0))}s"
            else:
                total_units = str(exercise.get('total_reps_completed', 0))
            table.add_row(
                exercise['name'],
                str(len(exercise['completed_sets'])),
                total_units,
                f"{exercise['calories_burned']:.1f}"
            )
        
        console.print(table)
        
        # Show summary
        console.print(f"\n📊 Workout Summary:")
        console.print(f"• Total Duration: {workout_log['total_duration']} minutes")
        console.print(f"• Total Calories: {workout_log['calories_burned']:.1f}")
        console.print(f"• Completion Rate: {workout_log['completion_percentage']:.1f}%")
        console.print(f"• Difficulty Rating: {workout_log['difficulty_rating']}/10")
        
        if workout_log.get('notes'):
            console.print(f"• Notes: {workout_log['notes']}")
    
    def _additional_workout_warning(self, user: User):
        """Show warning for additional workout"""
        console.print("\n⚠️  ADDITIONAL WORKOUT WARNING", style="bold yellow")
        console.print("="*50)
        
        warning_text = Text()
        warning_text.append("🚨 Important Considerations:\n\n", style="bold red")
        warning_text.append("• Overtraining can lead to injury and burnout\n")
        warning_text.append("• Your muscles need time to recover and grow\n")
        warning_text.append("• Rest is just as important as exercise\n")
        warning_text.append("• Consider light stretching or walking instead\n\n")
        warning_text.append("💡 Better alternatives:\n", style="bold green")
        warning_text.append("• Go for a walk or light cardio\n")
        warning_text.append("• Do some stretching or yoga\n")
        warning_text.append("• Focus on nutrition and hydration\n")
        warning_text.append("• Get adequate sleep for recovery\n")
        
        console.print(Panel(warning_text, title="Recovery is Important", border_style="yellow"))
        
        if Confirm.ask("Do you still want to proceed with another workout?"):
            console.print("🆓 Additional workout feature coming soon!", style="yellow")
            console.print("For now, we recommend focusing on recovery.", style="italic")
        else:
            console.print("✅ Smart choice! Focus on recovery today.", style="green")
    
    def _ad_hoc_workout(self, user: User):
        """Handle ad-hoc workout (not from plan)"""
        console.print("🆓 Ad-hoc workout feature coming soon!", style="yellow")
        console.print("For now, please use your scheduled workout plan.", style="italic")
    
    def show_progress_reports(self, user: User):
        """Show progress reports and analytics"""
        console.print("\n" + "="*50)
        console.print("📊 PROGRESS REPORTS", style="bold blue")
        console.print("="*50)
        
        # Get user stats
        stats = self.user_manager.get_user_stats(user)
        
        # Display current stats
        stats_text = Text()
        stats_text.append(f"Name: {stats['name']}\n", style="bold")
        stats_text.append(f"Fitness Level: {stats['fitness_level'].title()}\n")
        stats_text.append(f"Workout Streak: {stats['workout_streak']} days\n")
        stats_text.append(f"Total Workouts: {stats['total_workouts']}\n")
        stats_text.append(f"Total Calories Burned: {stats['calories_burned_total']:.1f}\n")
        
        if stats['days_since_last_workout'] is not None:
            stats_text.append(f"Days Since Last Workout: {stats['days_since_last_workout']}\n")
        
        console.print(Panel(stats_text, title="Current Stats", border_style="blue"))
        
        # Show analytics menu
        console.print("\nSelect analytics to view:")
        console.print("1. 📅 Daily Progress (This Week - Mon–Sat)")
        console.print("2. ⏱️ Per-Set Durations & Rest Times")
        console.print("4. 📊 Full Summary Table")
        choice = Prompt.ask("Select option", choices=["1","2","4"], default="4")

        if choice == "1":
            self._chart_daily_progress(user)
            return
        if choice == "2":
            self._chart_set_and_rest_times(user)
            return
        # Option 3 removed per user request

        # Show recent workout history (fallback/full summary)
        recent_logs = self._get_recent_workout_logs(user.id, days=30)
        
        if recent_logs:
            console.print("\n📈 Recent Workout History (Last 30 days):")
            
            table = Table(show_header=True, header_style="bold magenta")
            table.add_column("Date", style="cyan")
            table.add_column("Duration", justify="center")
            table.add_column("Calories", justify="center")
            table.add_column("Completion", justify="center")
            table.add_column("Difficulty", justify="center")
            
            for log in recent_logs[-10:]:  # Show last 10 workouts
                date = datetime.fromisoformat(log['date']).strftime('%m/%d')
                table.add_row(
                    date,
                    f"{log['total_duration']}m",
                    f"{log['calories_burned']:.0f}",
                    f"{log['completion_percentage']:.0f}%",
                    f"{log['difficulty_rating']}/10"
                )
            
            console.print(table)
        else:
            console.print("📝 No workout history found. Start working out to see your progress!", style="yellow")
        
        # Show progression info
        progression = self.fitness_assessor.suggest_level_progression(user)
        if progression["next_level"]:
            console.print(f"\n🎯 Progression Info:", style="bold yellow")
            console.print(f"Current Level: {progression['current_level'].title()}")
            console.print(f"Next Level: {progression['next_level'].title()}")
            console.print(f"Progress: {progression['current_score']:.1f}%")
            console.print(f"Message: {progression['message']}")
    
    def generate_progress_charts(self, user: User):
        """Generate progress visualization charts"""
        console.print("📊 Generating progress charts...", style="yellow")
        
        # Get workout logs
        recent_logs = self._get_recent_workout_logs(user.id, days=90)
        
        if not recent_logs:
            console.print("❌ No workout data available for charts", style="red")
            return
        
        # Prepare data
        dates = []
        calories = []
        durations = []
        completions = []
        
        for log in recent_logs:
            dates.append(datetime.fromisoformat(log['date']).date())
            calories.append(log['calories_burned'])
            durations.append(log['total_duration'])
            completions.append(log['completion_percentage'])
        
        # Create charts
        fig, axes = plt.subplots(2, 2, figsize=(12, 8))
        fig.suptitle(f'Workout Progress - {user.name}', fontsize=16)
        
        # Calories burned over time
        axes[0, 0].plot(dates, calories, marker='o')
        axes[0, 0].set_title('Calories Burned Over Time')
        axes[0, 0].set_ylabel('Calories')
        axes[0, 0].tick_params(axis='x', rotation=45)
        
        # Workout duration over time
        axes[0, 1].plot(dates, durations, marker='s', color='green')
        axes[0, 1].set_title('Workout Duration Over Time')
        axes[0, 1].set_ylabel('Minutes')
        axes[0, 1].tick_params(axis='x', rotation=45)
        
        # Completion percentage over time
        axes[1, 0].plot(dates, completions, marker='^', color='orange')
        axes[1, 0].set_title('Workout Completion Over Time')
        axes[1, 0].set_ylabel('Completion %')
        axes[1, 0].tick_params(axis='x', rotation=45)
        
        # Weekly summary
        weekly_calories = []
        weekly_dates = []
        current_week_start = None
        current_week_calories = 0
        
        for i, date in enumerate(dates):
            week_start = date - timedelta(days=date.weekday())
            
            if current_week_start is None:
                current_week_start = week_start
            
            if week_start == current_week_start:
                current_week_calories += calories[i]
            else:
                weekly_dates.append(current_week_start)
                weekly_calories.append(current_week_calories)
                current_week_start = week_start
                current_week_calories = calories[i]
        
        # Add the last week
        if current_week_start is not None:
            weekly_dates.append(current_week_start)
            weekly_calories.append(current_week_calories)
        
        axes[1, 1].bar(weekly_dates, weekly_calories, color='purple', alpha=0.7)
        axes[1, 1].set_title('Weekly Calories Burned')
        axes[1, 1].set_ylabel('Calories')
        axes[1, 1].tick_params(axis='x', rotation=45)
        
        plt.tight_layout()
        
        # Save chart
        chart_path = f"data/progress_charts/{user.id}_progress.png"
        os.makedirs(os.path.dirname(chart_path), exist_ok=True)
        plt.savefig(chart_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        console.print(f"✅ Progress charts saved to {chart_path}", style="green")
        console.print("📊 Charts show your progress over the last 90 days", style="blue")

    # ---------------------- Analytics helpers ----------------------
    def _is_time_based_exercise(self, exercise: Dict) -> bool:
        """Detect if an exercise is time-based (seconds) rather than reps.
        Priority: explicit flags, then name keywords.
        """
        try:
            if exercise.get('metric') == 'seconds':
                return True
            if exercise.get('is_time_based') is True:
                return True
            name = str(exercise.get('name', '')).lower()
            keywords = ['plank', 'wall sit', 'hold', 'hollow hold', 'side plank', 'boat pose', 'isometric', 'bridge hold']
            return any(k in name for k in keywords)
        except Exception:
            return False

    def _chart_daily_progress(self, user: User):
        logs = self._get_recent_workout_logs(user.id, days=14)
        # Build per-day calories consumed
        per_day_calories: Dict[str, float] = {}
        per_day_reductions: Dict[str, int] = {}
        for log in logs:
            dkey = datetime.fromisoformat(log['date']).date().isoformat()
            reductions = 0
            daily_calories = 0.0
            for ex in log.get('exercises_completed', []):
                try:
                    # Get calories burned from each exercise
                    calories = float(ex.get('calories_burned', 0.0))
                    daily_calories += calories
                    # Count reductions
                    sets = int(ex.get('target_sets', 0))
                    reps_or_secs = int(ex.get('target_reps', 0))
                    orig_sets = int(ex.get('original_sets', sets))
                    orig_reps = int(ex.get('original_reps', reps_or_secs))
                    if sets < orig_sets or reps_or_secs < orig_reps or ex.get('adaptation_applied'):
                        reductions += 1
                except Exception:
                    continue
            per_day_calories[dkey] = daily_calories
            per_day_reductions[dkey] = max(per_day_reductions.get(dkey, 0), reductions)

        # Current ISO week (Mon-Sat only)
        today = self._today()
        monday = today - timedelta(days=today.weekday())
        week_days = [monday + timedelta(days=i) for i in range(6)]  # Mon..Sat
        labels = [d.strftime('%d %b') for d in week_days]
        calorie_vals = []
        for d in week_days:
            dkey = d.isoformat()
            calories = per_day_calories.get(dkey, 0.0)
            calorie_vals.append(calories)

        x = np.arange(len(labels))
        plt.figure(figsize=(12,4))
        plt.bar(x, calorie_vals, width=0.5, color='#4e79a7')
        plt.title('📅 Daily Progress (This Week - Mon–Sat)')
        plt.ylabel('Calories Consumed')
        plt.ylim(0, max(calorie_vals) * 1.1 if calorie_vals else 100)
        plt.xticks(x, labels, rotation=0)

        # Annotate reductions above bar
        for idx, d in enumerate(week_days):
            red = per_day_reductions.get(d.isoformat(), 0)
            if red > 0:
                plt.text(x[idx], calorie_vals[idx] + max(calorie_vals) * 0.02, f"↓{red}", ha='center', va='bottom', color='#e15759', fontsize=9)

        os.makedirs('data/analytics', exist_ok=True)
        path = f'data/analytics/{user.id}_daily_progress.png'
        plt.tight_layout(); plt.savefig(path, dpi=220); plt.close()
        console.print(f"✅ Saved: {path}", style="green")

    # _chart_weekly_progress removed per user request

    def _chart_per_exercise(self, user: User):
        logs = self._get_recent_workout_logs(user.id, days=60)
        if not logs:
            console.print("❌ No logs for per-exercise charts", style="red")
            return
        reps_by_ex: Dict[str, int] = {}
        cals_by_ex: Dict[str, float] = {}
        for log in logs:
            for ex in log.get('exercises_completed', []):
                name = ex['name']
                reps_by_ex[name] = reps_by_ex.get(name, 0) + int(ex.get('total_reps_completed', 0))
                cals_by_ex[name] = cals_by_ex.get(name, 0.0) + float(ex.get('calories_burned', 0.0))
        # Plot top 10 by reps and calories
        def barplot(data: Dict[str, float], title: str, filename: str):
            items = sorted(data.items(), key=lambda x: x[1], reverse=True)[:10]
            labels = [k for k,_ in items]
            vals = [v for _,v in items]
            plt.figure(figsize=(10,4))
            plt.bar(labels, vals)
            plt.title(title)
            plt.xticks(rotation=45, ha='right')
            os.makedirs('data/analytics', exist_ok=True)
            path = f'data/analytics/{user.id}_{filename}'
            plt.tight_layout(); plt.savefig(path, dpi=200); plt.close()
            console.print(f"✅ Saved: {path}", style="green")
        barplot(reps_by_ex, 'Per-Exercise Total Reps (Top 10)', 'per_exercise_reps.png')  # type: ignore
        # Also include time-based totals for top 10 seconds
        # Build seconds_by_ex
        seconds_by_ex: Dict[str, int] = {}
        for log in logs:
            for ex in log.get('exercises_completed', []):
                if ex.get('metric') == 'seconds':
                    name = ex['name']
                    seconds_by_ex[name] = seconds_by_ex.get(name, 0) + int(ex.get('total_time_seconds', 0))
        if seconds_by_ex:
            barplot(seconds_by_ex, 'Per-Exercise Total Time (seconds, Top 10)', 'per_exercise_time.png')  # type: ignore
        barplot(cals_by_ex, 'Per-Exercise Total Calories (Top 10)', 'per_exercise_calories.png')

    def _chart_set_and_rest_times(self, user: User):
        logs = self._get_recent_workout_logs(user.id, days=30)
        if not logs:
            console.print("❌ No logs for set/rest time charts", style="red")
            return
        # Build a sequential timeline of bars: Set1, Rest1, Set2, Rest2 ... per exercise per day (recent)
        segments: List[float] = []  # minutes
        labels: List[str] = []
        colors: List[str] = []
        # Use latest day's log with timing data for clarity
        latest = None
        for log in sorted(logs, key=lambda x: x['date']):
            has_timing = any(ex.get('set_durations') for ex in log.get('exercises_completed', []))
            if has_timing:
                latest = log
        if not latest:
            console.print("📝 No set/rest timing data available yet.", style="yellow")
            return
        day_str = datetime.fromisoformat(latest['date']).strftime('%d %b')
        for ex in latest.get('exercises_completed', []):
            name = ex.get('name', 'Exercise')
            set_durs = ex.get('set_durations', [])
            rest_durs = ex.get('rest_durations', [])
            for idx, sd in enumerate(set_durs):
                segments.append(max(0.01, sd/60))
                labels.append(f"{name} S{idx+1} ({day_str})")
                colors.append('#4e79a7')  # set = blue
                if idx < len(rest_durs):
                    rd = rest_durs[idx]
                    segments.append(max(0.01, rd/60))
                    labels.append(f"{name} R{idx+1} ({day_str})")
                    colors.append('#f28e2b')  # rest = orange
            # Append inter-exercise rest if present
            per_ex_rest = float(ex.get('post_exercise_rest', 0.0))
            if per_ex_rest > 0:
                segments.append(max(0.01, per_ex_rest/60))
                labels.append(f"{name} NextEx Rest ({day_str})")
                colors.append('#e15759')  # inter-exercise rest = red
        # Plot as a categorical bar chart in order
        if not segments:
            console.print("📝 No set/rest timing data available yet.", style="yellow")
            return
        x = np.arange(len(segments))
        plt.figure(figsize=(min(16, 1 + len(segments)*0.6), 5))
        plt.bar(x, segments, color=colors)
        plt.xticks(x, labels, rotation=90)
        plt.ylabel('Minutes')
        plt.title('Set and Rest Timeline (Latest Day)')
        # Legend
        from matplotlib.patches import Patch
        plt.legend(handles=[
            Patch(color='#4e79a7', label='Set'),
            Patch(color='#f28e2b', label='Rest (intra-set)'),
            Patch(color='#e15759', label='Rest (between exercises)')
        ])
        os.makedirs('data/analytics', exist_ok=True)
        path = f'data/analytics/{user.id}_set_rest_timeline.png'
        plt.tight_layout(); plt.savefig(path, dpi=220); plt.close()
        console.print(f"✅ Saved: {path}", style="green")

    def _chart_calories_duration(self, user: User):
        logs = self._get_recent_workout_logs(user.id, days=60)
        if not logs:
            console.print("❌ No logs for calories/duration trends", style="red")
            return
        dates = []
        calories = []
        durations = []
        for log in logs:
            dates.append(datetime.fromisoformat(log['date']).date())
            calories.append(log.get('calories_burned', 0.0))
            durations.append(log.get('total_duration', 0))
        plt.figure(figsize=(10,4))
        plt.plot(dates, calories, marker='o', label='Calories')
        plt.plot(dates, durations, marker='s', label='Duration (min)')
        plt.title('Calories and Duration Trends')
        plt.legend(); plt.xticks(rotation=45)
        os.makedirs('data/analytics', exist_ok=True)
        path = f'data/analytics/{user.id}_calories_duration.png'
        plt.tight_layout(); plt.savefig(path, dpi=200); plt.close()
        console.print(f"✅ Saved: {path}", style="green")

    def _perform_nutrition_checkin(self, user: User, nutrition_tracker: NutritionTracker):
        """Perform daily nutrition check-in before workout"""
        console.print("\n" + "="*40)
        console.print("🍎 Daily Nutrition Check-in", style="bold blue")
        console.print("="*40)
        
        # Ask if user wants to log nutrition
        if not Confirm.ask("Would you like to log what you've eaten today?"):
            console.print("Skipping nutrition log...", style="yellow")
            return
        
        # Ask about nutrition goal if not set
        if not hasattr(user, 'nutrition_goal') or not user.nutrition_goal:
            console.print("\nLet's set your nutrition goal:")
            console.print("1. Maintain current weight")
            console.print("2. Lose weight")
            console.print("3. Gain muscle")
            
            goal_choice = Prompt.ask("Select your goal", choices=["1", "2", "3"], default="1")
            goal_map = {"1": "maintain", "2": "lose", "3": "gain"}
            user.nutrition_goal = goal_map[goal_choice]
            self.user_manager.update_user(user)
            console.print(f"✅ Nutrition goal set to: {user.nutrition_goal}", style="green")
        
        # Log meals
        console.print("\n📝 Log your meals for today:")
        console.print("You can either:")
        console.print("1. Describe what you ate (we'll estimate calories)")
        console.print("2. Enter calories directly")
        console.print("3. Skip meal logging")
        
        while True:
            choice = Prompt.ask("Choose option (1/2/3)", choices=["1", "2", "3"], default="3")
            
            if choice == "1":
                meal_description = Prompt.ask("Describe what you ate (e.g., '2 boiled eggs, 1 slice toast')")
                nutrition_tracker.log_meal(user, meal_description, None)
            elif choice == "2":
                try:
                    calories = float(Prompt.ask("Enter calories consumed"))
                    nutrition_tracker.log_meal(user, None, calories)
                except ValueError:
                    console.print("Invalid calorie value. Please enter a number.", style="red")
                    continue
            else:
                break
            
            if not Confirm.ask("Log another meal?"):
                break
        
        # Show nutrition summary
        console.print("\n📊 Today's Nutrition Summary:")
        nutrition_tracker.show_nutrition_summary(user)

