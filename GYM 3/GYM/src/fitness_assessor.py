"""
Fitness Assessment Module
Handles fitness level assessment through rep-based questions and scoring
"""

from typing import Dict, List, Tuple
from rich.console import Console
from rich.prompt import Prompt, IntPrompt, Confirm
from rich.panel import Panel
from rich.text import Text
from .user_manager import User

console = Console()

class FitnessAssessor:
    """Handles fitness level assessment"""
    
    def __init__(self):
        self.assessment_questions = {
            "push_ups": {
                "question": "How many push-ups can you do in one set?",
                "weights": {"male": 1.0, "female": 1.2, "other": 1.1},
                "scoring": {
                    "beginner": (0, 10),
                    "intermediate": (11, 25),
                    "advanced": (26, 50),
                    "expert": (51, 100)
                }
            },
            "pull_ups": {
                "question": "How many pull-ups can you do in one set?",
                "weights": {"male": 1.0, "female": 1.5, "other": 1.25},
                "scoring": {
                    "beginner": (0, 3),
                    "intermediate": (4, 8),
                    "advanced": (9, 15),
                    "expert": (16, 30)
                }
            },
            "squats": {
                "question": "How many bodyweight squats can you do in one set?",
                "weights": {"male": 1.0, "female": 1.0, "other": 1.0},
                "scoring": {
                    "beginner": (0, 15),
                    "intermediate": (16, 30),
                    "advanced": (31, 50),
                    "expert": (51, 100)
                }
            },
            "plank": {
                "question": "How long can you hold a plank (in seconds)?",
                "weights": {"male": 1.0, "female": 1.1, "other": 1.05},
                "scoring": {
                    "beginner": (0, 30),
                    "intermediate": (31, 60),
                    "advanced": (61, 120),
                    "expert": (121, 300)
                }
            },
            "burpees": {
                "question": "How many burpees can you do in one minute?",
                "weights": {"male": 1.0, "female": 1.2, "other": 1.1},
                "scoring": {
                    "beginner": (0, 5),
                    "intermediate": (6, 12),
                    "advanced": (13, 20),
                    "expert": (21, 35)
                }
            }
        }
        
        self.fitness_levels = {
            "beginner": {"min_score": 0, "max_score": 30, "description": "Just starting your fitness journey"},
            "intermediate": {"min_score": 31, "max_score": 60, "description": "Regular exerciser with good foundation"},
            "advanced": {"min_score": 61, "max_score": 85, "description": "Experienced and strong"},
            "expert": {"min_score": 86, "max_score": 100, "description": "Elite fitness level"}
        }
    
    def conduct_assessment(self, user: User) -> str:
        """Conduct fitness assessment for a user"""
        console.print("\n" + "="*50)
        console.print("📊 FITNESS ASSESSMENT", style="bold blue")
        console.print("="*50)
        
        console.print(f"Hello {user.name}! Let's assess your current fitness level.", style="green")
        console.print("We'll ask you about your performance in various exercises.", style="italic")
        console.print("Be honest for the most accurate assessment! 💪\n")
        
        if not Confirm.ask("Ready to start the assessment?"):
            console.print("Assessment cancelled.", style="yellow")
            return user.fitness_level
        
        total_score = 0
        max_possible_score = 0
        responses = {}
        
        for exercise, data in self.assessment_questions.items():
            console.print(f"\n🏃‍♂️ {exercise.replace('_', ' ').title()}")
            
            if exercise == "plank":
                # Special handling for time-based exercise
                response = IntPrompt.ask(data["question"], default=30)
                responses[exercise] = response
            else:
                response = IntPrompt.ask(data["question"], default=5)
                responses[exercise] = response
            
            # Calculate score for this exercise
            score = self._calculate_exercise_score(exercise, response, user.gender)
            total_score += score
            max_possible_score += 25  # Max score per exercise is 25
            
            console.print(f"Score: {score}/25", style="blue")
        
        # Calculate final fitness level
        percentage_score = (total_score / max_possible_score) * 100
        fitness_level = self._determine_fitness_level(percentage_score)
        
        # Update user
        user.fitness_level = fitness_level
        user.fitness_score = int(percentage_score)
        
        # Display results
        self._display_assessment_results(user, fitness_level, percentage_score, responses)
        
        return fitness_level
    
    def _calculate_exercise_score(self, exercise: str, reps: int, gender: str) -> int:
        """Calculate score for a specific exercise"""
        data = self.assessment_questions[exercise]
        weight = data["weights"][gender]
        
        # Apply gender weight
        adjusted_reps = reps * weight
        
        # Score based on level thresholds
        scoring = data["scoring"]
        
        # Calculate score based on which level the reps fall into
        if adjusted_reps <= scoring["beginner"][1]:
            # Within beginner range
            if scoring["beginner"][1] > 0:
                level_score = (adjusted_reps / scoring["beginner"][1]) * 20
            else:
                level_score = 0
        elif adjusted_reps <= scoring["intermediate"][1]:
            # Within intermediate range
            beginner_max = scoring["beginner"][1]
            intermediate_range = scoring["intermediate"][1] - scoring["intermediate"][0]
            if intermediate_range > 0:
                level_score = 20 + ((adjusted_reps - beginner_max) / intermediate_range) * 25
            else:
                level_score = 20
        elif adjusted_reps <= scoring["advanced"][1]:
            # Within advanced range
            intermediate_max = scoring["intermediate"][1]
            advanced_range = scoring["advanced"][1] - scoring["advanced"][0]
            if advanced_range > 0:
                level_score = 45 + ((adjusted_reps - intermediate_max) / advanced_range) * 25
            else:
                level_score = 45
        else:
            # Expert level or above
            advanced_max = scoring["advanced"][1]
            expert_range = scoring["expert"][1] - scoring["expert"][0]
            if expert_range > 0:
                level_score = 70 + min(30, ((adjusted_reps - advanced_max) / expert_range) * 30)
            else:
                level_score = 70
        
        return min(100, max(0, int(level_score)))
    
    def _determine_fitness_level(self, percentage_score: float) -> str:
        """Determine fitness level based on percentage score"""
        for level, data in self.fitness_levels.items():
            if data["min_score"] <= percentage_score <= data["max_score"]:
                return level
        return "beginner"  # Default fallback
    
    def _display_assessment_results(self, user: User, fitness_level: str, score: float, responses: Dict):
        """Display assessment results"""
        console.print("\n" + "="*50)
        console.print("📊 ASSESSMENT RESULTS", style="bold green")
        console.print("="*50)
        
        # Create results text
        results_text = Text()
        results_text.append(f"Name: {user.name}\n", style="bold")
        results_text.append(f"Fitness Level: {fitness_level.title()}\n", style="bold blue")
        results_text.append(f"Overall Score: {score:.1f}%\n\n", style="bold green")
        
        results_text.append("Your Performance:\n", style="bold")
        for exercise, reps in responses.items():
            results_text.append(f"• {exercise.replace('_', ' ').title()}: {reps}\n")
        
        results_text.append(f"\nDescription: {self.fitness_levels[fitness_level]['description']}\n", style="italic")
        
        # Recommendations
        results_text.append("\n🎯 Recommendations:\n", style="bold yellow")
        if fitness_level == "beginner":
            results_text.append("• Start with basic bodyweight exercises\n")
            results_text.append("• Focus on form over intensity\n")
            results_text.append("• Aim for 3-4 workouts per week\n")
        elif fitness_level == "intermediate":
            results_text.append("• Add resistance training\n")
            results_text.append("• Increase workout frequency to 4-5 times per week\n")
            results_text.append("• Focus on progressive overload\n")
        elif fitness_level == "advanced":
            results_text.append("• Advanced training techniques\n")
            results_text.append("• Periodization and deload weeks\n")
            results_text.append("• Sport-specific training if applicable\n")
        else:  # expert
            results_text.append("• Elite training protocols\n")
            results_text.append("• Competition preparation\n")
            results_text.append("• Advanced recovery techniques\n")
        
        console.print(Panel(results_text, title="Assessment Complete", border_style="green"))
    
    def get_fitness_level_requirements(self, level: str) -> Dict:
        """Get requirements for a specific fitness level"""
        if level not in self.fitness_levels:
            return {}
        
        requirements = {}
        for exercise, data in self.assessment_questions.items():
            scoring = data["scoring"]
            if level in scoring:
                requirements[exercise] = {
                    "min": scoring[level][0],
                    "max": scoring[level][1]
                }
        
        return requirements
    
    def suggest_level_progression(self, user: User) -> Dict:
        """Suggest next phase based on weekly completion (Mon–Sat) and nutrition balance.
        Rules:
        - If Beginner 1 and weekly completion >= 95%: suggest Beginner 2.
        - If Beginner 2 and weekly completion >= 95%: suggest Intermediate.
        - If weekly completion <= 60%: suggest downgrade one step.
        - Consider nutrition balance for optimal progression.
        Otherwise, show current weekly completion as progress.
        """
        current_level = user.fitness_level
        current_sublevel = getattr(user, 'fitness_sublevel', 1)

        # Compute weekly completion using ProgressTracker helper via import-on-demand
        from .progress_tracker import ProgressTracker
        import datetime
        pt = ProgressTracker()
        # Reuse its weekly computation logic by calling the same method's internals
        logs = pt._get_recent_workout_logs(user.id, days=10)
        if not logs:
            weekly_progress = 0.0
        else:
            today = pt._today()
            iso_year, iso_week, _ = today.isocalendar()
            by_date = {}
            for log in logs:
                log_dt = datetime.datetime.fromisoformat(log['date'])
                y, w, _ = log_dt.date().isocalendar()
                if (y, w) == (iso_year, iso_week):
                    dkey = log_dt.date().isoformat()
                    by_date.setdefault(dkey, []).append(log)
            monday = today - datetime.timedelta(days=today.weekday())
            training_days = [monday + datetime.timedelta(days=i) for i in range(6)]
            daily_progress = []
            for d in training_days:
                dkey = d.isoformat()
                entries = by_date.get(dkey, [])
                if not entries:
                    weekly_progress = 0.0
                    break
                vals = [e.get('completion_percentage', 0.0) for e in entries]
                daily_progress.append(max(vals) if vals else 0.0)
            else:
                weekly_progress = sum(daily_progress) / 6.0 if len(daily_progress) == 6 else 0.0

        # Check nutrition balance for optimal progression
        from .nutrition_tracker import NutritionTracker
        nt = NutritionTracker()
        nutrition_analysis = nt.analyze_calorie_balance(user)
        nutrition_on_track = nutrition_analysis["on_track"]
        
        # Adjust progression based on nutrition balance
        nutrition_factor = 1.0
        if not nutrition_on_track:
            # Reduce progression score if nutrition is not optimal
            nutrition_factor = 0.8
            weekly_progress *= nutrition_factor

        # Decide suggestion based on weekly completion
        if weekly_progress >= 95.0:
            if current_level == 'beginner' and current_sublevel == 1:
                message = f"Great week! Weekly completion {weekly_progress:.1f}%. Ready for Beginner 2."
                if not nutrition_on_track:
                    message += " Consider improving your nutrition balance for optimal results."
                return {
                    "current_level": current_level,
                    "next_level": "beginner",
                    "next_sublevel": 2,
                    "current_score": weekly_progress,
                    "message": message
                }
            # Promote to next level after Beginner 2 or for other levels' sublevels
            levels = ["beginner", "intermediate", "advanced", "expert"]
            if current_level == 'beginner' and current_sublevel == 2:
                next_level = 'intermediate'
            else:
                idx = levels.index(current_level)
                next_level = levels[min(len(levels)-1, idx+1)]
            if next_level == current_level:
                # Already at top within range
                message = "You're already at the highest level! 🏆"
                if not nutrition_on_track:
                    message += " Consider improving your nutrition balance for optimal results."
                return {"message": message, "next_level": None, "current_score": weekly_progress}
            message = f"Great week! Weekly completion {weekly_progress:.1f}%. Ready for {next_level.title()}."
            if not nutrition_on_track:
                message += " Consider improving your nutrition balance for optimal results."
            return {
                "current_level": current_level,
                "next_level": next_level,
                "next_sublevel": 1 if next_level != 'expert' else None,
                "current_score": weekly_progress,
                "message": message
            }

        if weekly_progress <= 60.0:
            # Suggest downgrade one step
            if current_level == 'beginner' and current_sublevel == 1:
                # Already lowest; encourage consistency
                message = f"Weekly completion {weekly_progress:.1f}%. Focus on consistency next week."
                if not nutrition_on_track:
                    message += " Also review your nutrition balance."
                return {
                    "current_level": current_level,
                    "next_level": None,
                    "current_score": weekly_progress,
                    "message": message
                }
            if current_level == 'beginner' and current_sublevel == 2:
                message = f"Weekly completion {weekly_progress:.1f}%. Suggest moving to Beginner 1 for now."
                if not nutrition_on_track:
                    message += " Also review your nutrition balance."
                return {
                    "current_level": current_level,
                    "next_level": 'beginner',
                    "next_sublevel": 1,
                    "current_score": weekly_progress,
                    "message": message
                }
            levels = ["beginner", "intermediate", "advanced", "expert"]
            idx = levels.index(current_level)
            downgrade = levels[max(0, idx-1)]
            message = f"Weekly completion {weekly_progress:.1f}%. Suggest moving to {downgrade.title()}."
            if not nutrition_on_track:
                message += " Also review your nutrition balance."
            return {
                "current_level": current_level,
                "next_level": downgrade,
                "next_sublevel": 2,
                "current_score": weekly_progress,
                "message": message
            }

        # Otherwise show progress within current phase
        message = f"Weekly completion so far: {weekly_progress:.1f}%. Keep going to reach 95% by Saturday."
        if not nutrition_on_track:
            message += " Review your nutrition balance for optimal progress."
        return {
            "current_level": current_level,
            "next_level": current_level if current_level == 'beginner' and current_sublevel == 1 else None,
            "next_sublevel": 2 if current_level == 'beginner' and current_sublevel == 1 else None,
            "current_score": weekly_progress,
            "message": message
        }
