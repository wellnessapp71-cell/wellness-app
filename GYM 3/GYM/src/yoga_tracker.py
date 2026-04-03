"""
Yoga Progress Tracker Module
Tracks yoga practice sessions and progress over time
"""

import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from rich.console import Console
from rich.table import Table
from rich.prompt import Prompt, Confirm
import matplotlib.pyplot as plt
import numpy as np

from .user_manager import User
from .yoga_planner import YogaPlanner

console = Console()

class YogaTracker:
    """Tracks yoga practice sessions and progress"""
    
    def __init__(self, logs_file: str = "data/yoga_logs.json"):
        self.logs_file = logs_file
        os.makedirs(os.path.dirname(self.logs_file), exist_ok=True)
    
    def track_yoga_session(self, user: User):
        """Track a yoga practice session"""
        console.print("\n🧘‍♀️ Yoga Session Tracking", style="bold blue")
        console.print("="*30)
        
        # Get today's date
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Check if session already logged today
        if self._is_session_logged_today(user.id, today):
            console.print("⚠️  You've already logged a yoga session today!", style="yellow")
            if not Confirm.ask("Do you want to log another session?"):
                return
        
        # Get yoga planner to fetch today's session
        yoga_planner = YogaPlanner()
        todays_session = yoga_planner.get_todays_yoga_session(user)
        
        if not todays_session:
            console.print("❌ No yoga session planned for today.", style="red")
            console.print("💡 Tip: Create a yoga plan first!", style="yellow")
            return
        
        # Display today's planned session
        console.print(f"\n📅 Today's Planned Session ({todays_session['duration']} minutes)", style="bold green")
        if todays_session["focus"]:
            console.print(f"Focus: {', '.join(todays_session['focus'])}", style="italic cyan")
        
        # Ask user if they completed the session
        completed = Confirm.ask("Did you complete today's yoga session?")
        
        if not completed:
            console.print("No problem! You can log your session when you're ready.", style="yellow")
            return
        
        # Get session details
        duration = int(Prompt.ask("How many minutes did you practice?", default=str(todays_session["duration"])))
        
        # Get practice quality rating
        quality = Prompt.ask(
            "How would you rate the quality of your practice?",
            choices=["excellent", "good", "average", "poor"],
            default="good"
        )
        
        # Get any notes
        notes = Prompt.ask("Any notes about your practice? (Optional)", default="")
        
        # Calculate calories burned (simplified estimation)
        # Yoga burns approximately 3-6 calories per minute depending on intensity
        intensity_factor = {"poor": 3, "average": 4, "good": 5, "excellent": 6}
        calories_burned = duration * intensity_factor[quality]
        
        # Create log entry
        log_entry = {
            "date": today,
            "duration": duration,
            "quality": quality,
            "calories_burned": calories_burned,
            "notes": notes,
            "focus": todays_session["focus"]
        }
        
        # Save log entry
        self._save_yoga_log(user.id, log_entry)
        
        # Update user stats
        user.total_workouts += 1
        user.calories_burned_total += calories_burned
        
        # Update streak
        self._update_yoga_streak(user)
        
        # Update weekly calorie tracking for nutrition integration
        user.weekly_calorie_burned += calories_burned
        
        from .user_manager import UserManager
        user_manager = UserManager()
        user_manager.update_user(user)
        
        console.print("✅ Yoga session logged successfully!", style="green")
        console.print(f"🔥 Calories burned: {calories_burned}", style="bold yellow")
        
        # Show streak
        if user.workout_streak > 1:
            console.print(f"🔥 Current streak: {user.workout_streak} days!", style="bold magenta")
    
    def _is_session_logged_today(self, user_id: str, date: str) -> bool:
        """Check if a yoga session was already logged today"""
        logs = self._load_yoga_logs(user_id)
        return any(log["date"] == date for log in logs)
    
    def _save_yoga_log(self, user_id: str, log_entry: Dict):
        """Save yoga log entry"""
        try:
            all_logs = {}
            if os.path.exists(self.logs_file):
                with open(self.logs_file, 'r') as f:
                    all_logs = json.load(f)
            
            if user_id not in all_logs:
                all_logs[user_id] = []
            
            all_logs[user_id].append(log_entry)
            
            with open(self.logs_file, 'w') as f:
                json.dump(all_logs, f, indent=2)
        except Exception as e:
            console.print(f"⚠️  Could not save yoga log: {e}", style="yellow")
    
    def _load_yoga_logs(self, user_id: str) -> List[Dict]:
        """Load yoga logs for a user"""
        try:
            if os.path.exists(self.logs_file):
                with open(self.logs_file, 'r') as f:
                    all_logs = json.load(f)
                    return all_logs.get(user_id, [])
        except Exception as e:
            console.print(f"⚠️  Could not load yoga logs: {e}", style="yellow")
        return []
    
    def _update_yoga_streak(self, user: User):
        """Update user's yoga practice streak"""
        logs = self._load_yoga_logs(user.id)
        
        if not logs:
            user.workout_streak = 1
            user.last_workout = datetime.now()
            return
        
        # Sort logs by date
        logs.sort(key=lambda x: x["date"], reverse=True)
        
        # Check if last workout was yesterday
        if user.last_workout:
            yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
            last_workout_date = user.last_workout.strftime("%Y-%m-%d")
            
            if last_workout_date == yesterday:
                user.workout_streak += 1
            elif last_workout_date != datetime.now().strftime("%Y-%m-%d"):
                # Reset streak if last workout was not today or yesterday
                user.workout_streak = 1
        else:
            user.workout_streak = 1
        
        user.last_workout = datetime.now()
    
    def show_yoga_progress(self, user: User):
        """Show yoga progress reports"""
        console.print(f"\n📈 {user.name}'s Yoga Progress", style="bold blue")
        console.print("="*40)
        
        # Load logs
        logs = self._load_yoga_logs(user.id)
        
        if not logs:
            console.print("No yoga sessions logged yet.", style="yellow")
            console.print("Start practicing to see your progress!", style="green")
            return
        
        # Sort logs by date
        logs.sort(key=lambda x: x["date"])
        
        # Overall stats
        total_sessions = len(logs)
        total_duration = sum(log["duration"] for log in logs)
        total_calories = sum(log["calories_burned"] for log in logs)
        avg_duration = total_duration / total_sessions if total_sessions > 0 else 0
        avg_calories = total_calories / total_sessions if total_sessions > 0 else 0
        
        # Quality distribution
        quality_count = {"excellent": 0, "good": 0, "average": 0, "poor": 0}
        for log in logs:
            quality_count[log["quality"]] += 1
        
        # Recent streak
        current_streak = user.workout_streak
        
        # Display stats
        stats_table = Table(title="Overall Statistics", show_header=True, header_style="bold magenta")
        stats_table.add_column("Metric", style="cyan")
        stats_table.add_column("Value", style="green")
        
        stats_table.add_row("Total Sessions", str(total_sessions))
        stats_table.add_row("Total Duration (min)", str(total_duration))
        stats_table.add_row("Total Calories Burned", str(int(total_calories)))
        stats_table.add_row("Average Duration (min)", f"{avg_duration:.1f}")
        stats_table.add_row("Average Calories/Session", f"{avg_calories:.1f}")
        stats_table.add_row("Current Streak (days)", str(current_streak))
        
        console.print(stats_table)
        
        # Quality distribution
        quality_table = Table(title="Practice Quality Distribution", show_header=True, header_style="bold magenta")
        quality_table.add_column("Quality", style="cyan")
        quality_table.add_column("Count", style="green")
        quality_table.add_column("Percentage", style="yellow")
        
        for quality, count in quality_count.items():
            if count > 0:
                percentage = (count / total_sessions) * 100
                quality_table.add_row(
                    quality.title(), 
                    str(count), 
                    f"{percentage:.1f}%"
                )
        
        console.print(quality_table)
        
        # Recent sessions (last 7)
        console.print("\n📅 Recent Sessions", style="bold blue")
        recent_logs = logs[-7:] if len(logs) >= 7 else logs
        
        session_table = Table(show_header=True, header_style="bold magenta")
        session_table.add_column("Date", style="cyan")
        session_table.add_column("Duration", style="green")
        session_table.add_column("Calories", style="yellow")
        session_table.add_column("Quality", style="blue")
        
        for log in reversed(recent_logs):  # Show newest first
            session_table.add_row(
                log["date"],
                f"{log['duration']} min",
                str(log["calories_burned"]),
                log["quality"].title()
            )
        
        console.print(session_table)
        
        # Show streak motivation
        if current_streak >= 7:
            console.print(f"\n🔥 Amazing work! {current_streak} day streak! 🔥", style="bold green")
        elif current_streak >= 3:
            console.print(f"\n💪 Great consistency! {current_streak} day streak!", style="bold yellow")
        else:
            console.print(f"\n🌟 Keep it up! Every practice counts!", style="bold blue")
    
    def get_weekly_yoga_summary(self, user: User) -> Dict:
        """Get weekly yoga summary for nutrition integration"""
        logs = self._load_yoga_logs(user.id)
        
        if not logs:
            return {
                "total_duration": 0,
                "total_calories": 0,
                "sessions_count": 0
            }
        
        # Filter for last 7 days
        one_week_ago = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
        recent_logs = [log for log in logs if log["date"] >= one_week_ago]
        
        return {
            "total_duration": sum(log["duration"] for log in recent_logs),
            "total_calories": sum(log["calories_burned"] for log in recent_logs),
            "sessions_count": len(recent_logs)
        }
    
    def generate_yoga_progress_charts(self, user: User):
        """Generate progress visualization charts for yoga practice"""
        console.print("📊 Generating yoga progress charts...", style="yellow")
        
        # Get yoga logs
        logs = self._load_yoga_logs(user.id)
        
        if not logs:
            console.print("❌ No yoga data available for charts", style="red")
            return
        
        # Prepare data
        dates = []
        durations = []
        calories = []
        qualities = []
        
        for log in logs:
            dates.append(datetime.fromisoformat(log['date']).date())
            durations.append(log['duration'])
            calories.append(log['calories_burned'])
            qualities.append(log['quality'])
        
        # Create charts
        fig, axes = plt.subplots(2, 2, figsize=(12, 8))
        fig.suptitle(f'Yoga Progress - {user.name}', fontsize=16)
        
        # Duration over time
        axes[0, 0].plot(dates, durations, marker='o', color='green')
        axes[0, 0].set_title('Practice Duration Over Time')
        axes[0, 0].set_ylabel('Minutes')
        axes[0, 0].tick_params(axis='x', rotation=45)
        
        # Calories burned over time
        axes[0, 1].plot(dates, calories, marker='s', color='orange')
        axes[0, 1].set_title('Calories Burned Over Time')
        axes[0, 1].set_ylabel('Calories')
        axes[0, 1].tick_params(axis='x', rotation=45)
        
        # Quality distribution
        quality_counts = {}
        for quality in qualities:
            quality_counts[quality] = quality_counts.get(quality, 0) + 1
        
        quality_names = list(quality_counts.keys())
        quality_values = list(quality_counts.values())
        
        axes[1, 0].bar(quality_names, quality_values, color=['red', 'orange', 'yellow', 'green'])
        axes[1, 0].set_title('Practice Quality Distribution')
        axes[1, 0].set_ylabel('Count')
        
        # Weekly summary
        weekly_durations = []
        weekly_calories = []
        weekly_dates = []
        current_week_start = None
        current_week_duration = 0
        current_week_calories = 0
        
        for i, date in enumerate(dates):
            week_start = date - timedelta(days=date.weekday())
            
            if current_week_start is None:
                current_week_start = week_start
            
            if week_start == current_week_start:
                current_week_duration += durations[i]
                current_week_calories += calories[i]
            else:
                weekly_dates.append(current_week_start)
                weekly_durations.append(current_week_duration)
                weekly_calories.append(current_week_calories)
                current_week_start = week_start
                current_week_duration = durations[i]
                current_week_calories = calories[i]
        
        # Add the last week
        if current_week_start is not None:
            weekly_dates.append(current_week_start)
            weekly_durations.append(current_week_duration)
            weekly_calories.append(current_week_calories)
        
        x_pos = range(len(weekly_dates))
        axes[1, 1].bar(x_pos, weekly_durations, color='purple', alpha=0.7)
        axes[1, 1].set_title('Weekly Practice Duration')
        axes[1, 1].set_ylabel('Minutes')
        axes[1, 1].set_xticks(x_pos)
        axes[1, 1].set_xticklabels([date.strftime('%m/%d') for date in weekly_dates], rotation=45)
        
        plt.tight_layout()
        
        # Save chart
        chart_path = f"data/progress_charts/{user.id}_yoga_progress.png"
        os.makedirs(os.path.dirname(chart_path), exist_ok=True)
        plt.savefig(chart_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        console.print(f"✅ Yoga progress charts saved to {chart_path}", style="green")
        console.print("📊 Charts show your yoga progress over time", style="blue")
