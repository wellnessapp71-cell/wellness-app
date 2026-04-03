"""
Yoga Assessment Module
Handles yoga level assessment through pose-based questions and scoring
"""

from typing import Dict, List, Tuple
from rich.console import Console
from rich.prompt import Prompt, IntPrompt, Confirm
from rich.panel import Panel
from rich.text import Text
from .user_manager import User

console = Console()

class YogaAssessor:
    """Handles yoga level assessment"""
    
    def __init__(self):
        self.assessment_questions = {
            "flexibility": {
                "question": "How flexible are you in forward bends?",
                "description": "Can you touch your toes while standing or sitting?",
                "scoring": {
                    "beginner": "Barely can touch knees or cannot touch toes",
                    "intermediate": "Can touch toes with slight bend in knees",
                    "advanced": "Can touch toes with straight legs",
                    "expert": "Can place palms flat on floor beyond toes"
                }
            },
            "balance": {
                "question": "How steady can you hold balancing poses?",
                "description": "Tree pose, eagle pose, or one-legged standing",
                "scoring": {
                    "beginner": "Cannot hold for more than 10 seconds",
                    "intermediate": "Can hold for 10-30 seconds",
                    "advanced": "Can hold for 30-60 seconds",
                    "expert": "Can hold for more than 60 seconds with ease"
                }
            },
            "strength": {
                "question": "How many modified push-ups can you do?",
                "description": "On knees or against wall",
                "scoring": {
                    "beginner": "0-5 repetitions",
                    "intermediate": "6-15 repetitions",
                    "advanced": "16-25 repetitions",
                    "expert": "26+ repetitions"
                }
            },
            "endurance": {
                "question": "How long can you hold plank pose?",
                "description": "Standard plank position",
                "scoring": {
                    "beginner": "0-20 seconds",
                    "intermediate": "21-45 seconds",
                    "advanced": "46-90 seconds",
                    "expert": "91+ seconds"
                }
            },
            "meditation": {
                "question": "How comfortable are you with meditation?",
                "description": "Sitting still and focusing",
                "scoring": {
                    "beginner": "Cannot sit still for more than 2 minutes",
                    "intermediate": "Can sit still for 2-5 minutes",
                    "advanced": "Can sit still for 5-15 minutes",
                    "expert": "Can sit still for 15+ minutes with focus"
                }
            }
        }
        
        self.yoga_levels = {
            "beginner": {"description": "New to yoga, building foundation"},
            "intermediate": {"description": "Regular practice, improving skills"},
            "advanced": {"description": "Experienced practitioner, strong foundation"},
            "expert": {"description": "Master level practitioner"}
        }
        
        # Yoga goals by level
        self.yoga_goals = {
            "flexibility": {
                "beginner": ["Seated forward bend", "Child's pose", "Cat-cow"],
                "intermediate": ["Triangle pose", "Pigeon pose", "Lizard"],
                "expert": ["Full splits", "King pigeon", "Wheel pose"]
            },
            "stress_reduction": {
                "beginner": ["Shavasana", "Nadi Shodhana", "Hatha yoga"],
                "intermediate": ["Vinyasa with breath", "Yoga Nidra", "Ujjayi"],
                "expert": ["Silent meditation", "Kundalini kriyas", "Long Pranayama"]
            },
            "posture": {
                "beginner": ["Tadasana", "Bridge", "Cobra"],
                "intermediate": ["Warrior series", "Plank holds", "Dolphin"],
                "expert": ["Handstands", "Crow pose", "Deep backbends"]
            },
            "balance": {
                "beginner": ["Tree pose", "Eagle arms seated"],
                "intermediate": ["Warrior III", "Dancer pose", "One-leg plank"],
                "expert": ["Handstand", "Crow-to-headstand transitions"]
            },
            "core_strength": {
                "beginner": ["Cat-cow crunches", "Boat pose", "Plank"],
                "intermediate": ["Leg raises", "Dolphin plank", "Side plank"],
                "expert": ["Vasisthasana", "Crow pose"]
            },
            "spinal_health": {
                "beginner": ["Supine twist", "Cobra", "Supported bridge"],
                "intermediate": ["Locust", "Spinal wave", "Sphinx to cobra"],
                "expert": ["Wheel", "Full camel", "Shoulder stand series"]
            },
            "detoxification": {
                "beginner": ["Easy seated twist", "Lion's breath"],
                "intermediate": ["Revolved triangle", "Kapalbhati"],
                "expert": ["Advanced pranayama", "Kriyas"]
            }
        }
    
    def conduct_assessment(self, user: User) -> str:
        """Conduct yoga assessment for a user"""
        console.print("\n" + "="*50)
        console.print("🧘‍♀️ YOGA ASSESSMENT", style="bold blue")
        console.print("="*50)
        
        console.print(f"Hello {user.name}! Let's assess your current yoga level.", style="green")
        console.print("We'll ask you about your performance in various yoga aspects.", style="italic")
        console.print("Be honest for the most accurate assessment! 🙏\n")
        
        if not Confirm.ask("Ready to start the assessment?"):
            console.print("Assessment cancelled.", style="yellow")
            return user.fitness_level
        
        scores = {}
        
        for category, data in self.assessment_questions.items():
            console.print(f"\n🧘 {data['question']}")
            console.print(f"Description: {data['description']}", style="dim")
            
            # Show scoring options
            console.print("\nScoring Options:")
            for level, description in data["scoring"].items():
                console.print(f"  {level.title()}: {description}")
            
            level_choice = Prompt.ask(
                "Select your level", 
                choices=["beginner", "intermediate", "advanced", "expert"],
                default="beginner"
            )
            
            scores[category] = level_choice
            console.print(f"Selected: {level_choice.title()}", style="blue")
        
        # Determine overall yoga level based on responses
        fitness_level = self._determine_yoga_level(scores)
        
        # Update user
        user.fitness_level = fitness_level
        user.fitness_type = "yoga"
        
        # Display results
        self._display_assessment_results(user, fitness_level, scores)
        
        return fitness_level
    
    def _determine_yoga_level(self, scores: Dict[str, str]) -> str:
        """Determine overall yoga level based on individual scores"""
        # Count levels
        level_counts = {"beginner": 0, "intermediate": 0, "advanced": 0, "expert": 0}
        
        for level in scores.values():
            level_counts[level] += 1
        
        # Find the most common level
        max_count = max(level_counts.values())
        most_common_levels = [level for level, count in level_counts.items() if count == max_count]
        
        # If there's a tie, choose the lower level
        if len(most_common_levels) > 1:
            level_order = ["beginner", "intermediate", "advanced", "expert"]
            return min(most_common_levels, key=lambda x: level_order.index(x))
        
        return most_common_levels[0]
    
    def _display_assessment_results(self, user: User, fitness_level: str, scores: Dict):
        """Display assessment results"""
        console.print("\n" + "="*50)
        console.print("🧘‍♀️ YOGA ASSESSMENT RESULTS", style="bold green")
        console.print("="*50)
        
        # Create results text
        results_text = Text()
        results_text.append(f"Name: {user.name}\n", style="bold")
        results_text.append(f"Yoga Level: {fitness_level.title()}\n", style="bold blue")
        results_text.append(f"Type: Yoga\n\n", style="bold")
        
        results_text.append("Your Performance:\n", style="bold")
        for category, level in scores.items():
            results_text.append(f"• {category.replace('_', ' ').title()}: {level.title()}\n")
        
        results_text.append(f"\nDescription: {self.yoga_levels[fitness_level]['description']}\n", style="italic")
        
        # Recommendations
        results_text.append("\n🎯 Recommended Poses for Your Level:\n", style="bold yellow")
        for goal, poses in self.yoga_goals.items():
            if fitness_level in poses:
                results_text.append(f"\n{goal.replace('_', ' ').title()}:\n", style="bold cyan")
                for pose in poses[fitness_level]:
                    results_text.append(f"  • {pose}\n", style="green")
        
        console.print(Panel(results_text, title="Your Yoga Journey", border_style="green"))
        
        console.print("\n💡 Next Steps:")
        console.print("• Start with the recommended poses for your level")
        console.print("• Practice regularly to progress")
        console.print("• Consider setting specific yoga goals")
        console.print("• Track your progress over time")
    
    def get_yoga_goals_for_level(self, level: str) -> Dict:
        """Get yoga goals and poses for a specific level"""
        goals = {}
        for goal_name, poses in self.yoga_goals.items():
            if level in poses:
                goals[goal_name] = poses[level]
        return goals
    
    def suggest_level_progression(self, user: User) -> Dict:
        """Suggest next yoga level based on practice consistency"""
        # For yoga, we'll base progression on practice frequency and consistency
        # This is a simplified version - in a real implementation, this would be more complex
        
        current_level = user.fitness_level
        levels = ["beginner", "intermediate", "advanced", "expert"]
        
        if current_level == "expert":
            return {
                "current_level": current_level,
                "next_level": None,
                "message": "You're at the highest yoga level! 🏆 Continue your practice."
            }
        
        current_index = levels.index(current_level)
        next_level = levels[current_index + 1]
        
        # Check if user has been consistent (simplified check)
        if user.total_workouts >= 30 and user.workout_streak >= 7:
            return {
                "current_level": current_level,
                "next_level": next_level,
                "message": f"Great consistency! Ready to advance to {next_level.title()} level."
            }
        elif user.total_workouts >= 15:
            return {
                "current_level": current_level,
                "next_level": None,
                "message": f"Good progress! Continue practicing to advance to {next_level.title()} level."
            }
        else:
            return {
                "current_level": current_level,
                "next_level": None,
                "message": "Keep practicing regularly to build your yoga foundation."
            }