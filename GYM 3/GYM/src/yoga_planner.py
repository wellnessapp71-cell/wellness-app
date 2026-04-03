"""
Yoga Planner Module
Generates personalized yoga sequences based on user level and goals
"""

import json
import os
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from .user_manager import User

console = Console()

class YogaPlanner:
    """Generates personalized yoga plans"""
    
    def __init__(self, plans_file: str = "data/yoga_plans.json"):
        self.plans_file = plans_file
        self.yoga_poses = self._load_yoga_poses()
        os.makedirs(os.path.dirname(self.plans_file), exist_ok=True)
    
    def _load_yoga_poses(self) -> Dict:
        """Load yoga poses database"""
        # Comprehensive yoga pose database
        return {
            "beginner": {
                "warm_up": [
                    {"name": "Mountain Pose (Tadasana)", "duration": 30, "benefits": "Improves posture and balance"},
                    {"name": "Neck Rolls", "duration": 60, "benefits": "Releases neck tension"},
                    {"name": "Shoulder Rolls", "duration": 60, "benefits": "Loosens shoulder joints"},
                    {"name": "Cat-Cow Stretch", "duration": 60, "benefits": "Warms up spine"},
                    {"name": "Seated Side Stretch", "duration": 60, "benefits": "Stretches side body"}
                ],
                "standing": [
                    {"name": "Mountain Pose (Tadasana)", "duration": 60, "benefits": "Foundation pose"},
                    {"name": "Forward Fold (Uttanasana)", "duration": 60, "benefits": "Stretches hamstrings"},
                    {"name": "Halfway Lift (Ardha Uttanasana)", "duration": 30, "benefits": "Strengthens back"},
                    {"name": "Chair Pose (Utkatasana)", "duration": 30, "benefits": "Strengthens legs"},
                    {"name": "Tree Pose (Vrksasana)", "duration": 30, "benefits": "Improves balance"}
                ],
                "floor": [
                    {"name": "Child's Pose (Balasana)", "duration": 60, "benefits": "Relaxes and stretches"},
                    {"name": "Cobra Pose (Bhujangasana)", "duration": 30, "benefits": "Strengthens spine"},
                    {"name": "Downward Dog (Adho Mukha Svanasana)", "duration": 60, "benefits": "Full body stretch"},
                    {"name": "Bridge Pose (Setu Bandhasana)", "duration": 30, "benefits": "Opens chest and hips"},
                    {"name": "Supine Twist", "duration": 60, "benefits": "Releases spine tension"}
                ],
                "cool_down": [
                    {"name": "Happy Baby Pose (Ananda Balasana)", "duration": 60, "benefits": "Releases hip tension"},
                    {"name": "Knee-to-Chest Pose", "duration": 60, "benefits": "Calms nervous system"},
                    {"name": "Corpse Pose (Savasana)", "duration": 180, "benefits": "Deep relaxation"}
                ]
            },
            "intermediate": {
                "warm_up": [
                    {"name": "Sun Salutation A (Surya Namaskar A)", "repetitions": 3, "benefits": "Dynamic warm-up"},
                    {"name": "Cat-Cow Flow", "duration": 60, "benefits": "Spinal mobility"},
                    {"name": "Thread the Needle", "duration": 60, "benefits": "Shoulder release"},
                    {"name": "Seated Spinal Twist", "duration": 60, "benefits": "Detoxifying twist"}
                ],
                "standing": [
                    {"name": "Warrior I (Virabhadrasana I)", "duration": 30, "benefits": "Strength and focus"},
                    {"name": "Warrior II (Virabhadrasana II)", "duration": 30, "benefits": "Leg strength"},
                    {"name": "Triangle Pose (Trikonasana)", "duration": 30, "benefits": "Full body stretch"},
                    {"name": "Extended Side Angle", "duration": 30, "benefits": "Hip opening"},
                    {"name": "Tree Pose (Vrksasana)", "duration": 30, "benefits": "Balance challenge"}
                ],
                "floor": [
                    {"name": "Pigeon Pose (Eka Pada Rajakapotasana)", "duration": 60, "benefits": "Hip opener"},
                    {"name": "Plank Pose", "duration": 30, "benefits": "Core strength"},
                    {"name": "Side Plank (Vasisthasana)", "duration": 30, "benefits": "Oblique strength"},
                    {"name": "Boat Pose (Navasana)", "duration": 30, "benefits": "Core strengthening"},
                    {"name": "Locust Pose (Salabhasana)", "duration": 30, "benefits": "Back strengthening"}
                ],
                "cool_down": [
                    {"name": "Reclined Bound Angle Pose", "duration": 120, "benefits": "Hip and heart opener"},
                    {"name": "Legs-Up-The-Wall Pose", "duration": 180, "benefits": "Calming inversion"},
                    {"name": "Corpse Pose (Savasana)", "duration": 300, "benefits": "Deep relaxation"}
                ]
            },
            "advanced": {
                "warm_up": [
                    {"name": "Sun Salutation B (Surya Namaskar B)", "repetitions": 3, "benefits": "Intense warm-up"},
                    {"name": "Dynamic Cat-Cow", "duration": 60, "benefits": "Spinal flexibility"},
                    {"name": "Pigeon Pose Prep", "duration": 60, "benefits": "Hip preparation"}
                ],
                "standing": [
                    {"name": "Warrior III (Virabhadrasana III)", "duration": 30, "benefits": "Balance and strength"},
                    {"name": "Extended Hand to Big Toe (Utthita Hasta Padangusthasana)", "duration": 30, "benefits": "Balance and flexibility"},
                    {"name": "Revolved Triangle (Parivrtta Trikonasana)", "duration": 30, "benefits": "Twist and balance"},
                    {"name": "Crow Pose (Bakasana)", "duration": 30, "benefits": "Arm balance prep"}
                ],
                "floor": [
                    {"name": "King Pigeon Pose", "duration": 60, "benefits": "Deep hip opener"},
                    {"name": "Wheel Pose (Urdhva Dhanurasana)", "duration": 30, "benefits": "Backbend"},
                    {"name": "Side Crow (Parsva Bakasana)", "duration": 30, "benefits": "Arm balance"},
                    {"name": "Firefly Pose (Tittibhasana)", "duration": 30, "benefits": "Advanced arm balance"},
                    {"name": "Forearm Stand Prep", "duration": 60, "benefits": "Inversion preparation"}
                ],
                "cool_down": [
                    {"name": "Head-to-Knee Forward Bend", "duration": 120, "benefits": "Deep forward fold"},
                    {"name": "Reclined Spinal Twist", "duration": 120, "benefits": "Spinal release"},
                    {"name": "Corpse Pose (Savasana)", "duration": 300, "benefits": "Integration"}
                ]
            },
            "expert": {
                "warm_up": [
                    {"name": "Full Sun Salutation Flow", "repetitions": 5, "benefits": "Complete warm-up"},
                    {"name": "Advanced Cat-Cow Flow", "duration": 60, "benefits": "Spinal articulation"}
                ],
                "standing": [
                    {"name": "Dancer Pose (Natarajasana)", "duration": 30, "benefits": "Balance and flexibility"},
                    {"name": "Handstand (Adho Mukha Vrksasana)", "duration": 30, "benefits": "Inversion"},
                    {"name": "Bird of Paradise", "duration": 30, "benefits": "Hip opening and balance"}
                ],
                "floor": [
                    {"name": "Full Splits (Hanumanasana)", "duration": 60, "benefits": "Extreme flexibility"},
                    {"name": "Eight-Angle Pose (Astavakrasana)", "duration": 30, "benefits": "Advanced arm balance"},
                    {"name": "Flying Crow (Eka Pada Galavasana)", "duration": 30, "benefits": "Advanced arm balance"},
                    {"name": "Wheel Pose (Urdhva Dhanurasana)", "duration": 60, "benefits": "Deep backbend"}
                ],
                "cool_down": [
                    {"name": "Shoulder Stand (Sarvangasana)", "duration": 120, "benefits": "Inversion"},
                    {"name": "Plow Pose (Halasana)", "duration": 120, "benefits": "Deep stretch"},
                    {"name": "Corpse Pose (Savasana)", "duration": 600, "benefits": "Deep integration"}
                ]
            }
        }
    
    def create_yoga_plan(self, user: User, session_minutes: int = 30) -> Dict:
        """Create a personalized yoga plan for the user"""
        console.print(f"🧘‍♀️ Creating yoga plan for {user.name}...", style="blue")
        
        # Determine level-appropriate poses
        level = user.fitness_level
        if level not in self.yoga_poses:
            level = "beginner"  # Fallback to beginner level
        
        poses = self.yoga_poses[level]
        
        # Create a balanced session
        plan = {
            "user_id": user.id,
            "created_at": datetime.now().isoformat(),
            "level": level,
            "sessions": {}
        }
        
        # Create 6 days of yoga practice (Mon-Sat)
        days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
        
        for day in days:
            session = self._create_daily_session(poses, session_minutes, user.goals)
            plan["sessions"][day] = session
        
        # Save plan
        self._save_yoga_plan(user.id, plan)
        
        console.print("✅ Yoga plan created successfully!", style="green")
        return plan
    
    def _create_daily_session(self, poses: Dict, session_minutes: int, goals: List[str]) -> Dict:
        """Create a daily yoga session"""
        # Calculate time allocation
        warm_up_time = max(5, session_minutes // 6)  # At least 5 minutes
        cool_down_time = max(5, session_minutes // 6)  # At least 5 minutes
        main_practice_time = session_minutes - warm_up_time - cool_down_time
        
        session = {
            "duration": session_minutes,
            "warm_up": [],
            "main_practice": [],
            "cool_down": [],
            "focus": []
        }
        
        # Add warm-up poses
        warm_up_duration = 0
        for pose in poses["warm_up"]:
            if warm_up_duration + pose.get("duration", 30) <= warm_up_time * 60:
                session["warm_up"].append(pose)
                warm_up_duration += pose.get("duration", 30)
            elif "repetitions" in pose and warm_up_duration + 60 <= warm_up_time * 60:
                session["warm_up"].append(pose)
                warm_up_duration += 60
        
        # Add cool-down poses
        cool_down_duration = 0
        for pose in poses["cool_down"]:
            if cool_down_duration + pose.get("duration", 30) <= cool_down_time * 60:
                session["cool_down"].append(pose)
                cool_down_duration += pose.get("duration", 30)
        
        # Add main practice poses based on user goals
        main_practice_duration = 0
        standing_poses = poses.get("standing", [])
        floor_poses = poses.get("floor", [])
        
        # Mix standing and floor poses
        all_main_poses = standing_poses + floor_poses
        selected_poses = random.sample(all_main_poses, min(len(all_main_poses), max(5, main_practice_time // 5)))
        
        for pose in selected_poses:
            if main_practice_duration + pose.get("duration", 30) <= main_practice_time * 60:
                session["main_practice"].append(pose)
                main_practice_duration += pose.get("duration", 30)
            elif "repetitions" in pose and main_practice_duration + 60 <= main_practice_time * 60:
                session["main_practice"].append(pose)
                main_practice_duration += 60
        
        # Determine session focus based on goals
        goal_mapping = {
            "flexibility": "Flexibility & Stretching",
            "stress_reduction": "Relaxation & Meditation",
            "posture": "Posture & Alignment",
            "balance": "Balance & Stability",
            "core_strength": "Core Strengthening",
            "spinal_health": "Spinal Health",
            "detoxification": "Detox & Cleansing"
        }
        
        for goal in goals:
            if goal in goal_mapping:
                session["focus"].append(goal_mapping[goal])
        
        if not session["focus"]:
            session["focus"] = ["General Wellness"]
        
        return session
    
    def _save_yoga_plan(self, user_id: str, plan: Dict):
        """Save yoga plan to file"""
        try:
            plans = {}
            if os.path.exists(self.plans_file):
                with open(self.plans_file, 'r') as f:
                    plans = json.load(f)
            
            plans[user_id] = plan
            
            with open(self.plans_file, 'w') as f:
                json.dump(plans, f, indent=2)
        except Exception as e:
            console.print(f"⚠️  Could not save yoga plan: {e}", style="yellow")
    
    def load_yoga_plan(self, user_id: str) -> Optional[Dict]:
        """Load yoga plan for a user"""
        try:
            if os.path.exists(self.plans_file):
                with open(self.plans_file, 'r') as f:
                    plans = json.load(f)
                    return plans.get(user_id)
        except Exception as e:
            console.print(f"⚠️  Could not load yoga plan: {e}", style="yellow")
        return None
    
    def display_yoga_plan(self, user: User):
        """Display the yoga plan for the user"""
        plan = self.load_yoga_plan(user.id)
        
        if not plan:
            console.print("❌ No yoga plan found. Create one first!", style="red")
            return
        
        console.print(f"\n🧘‍♀️ {user.name}'s Yoga Plan", style="bold blue")
        console.print(f"Level: {plan['level'].title()}", style="green")
        console.print("="*50)
        
        days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        
        for day, day_name in zip(days, day_names):
            if day in plan["sessions"]:
                session = plan["sessions"][day]
                console.print(f"\n📅 {day_name} ({session['duration']} minutes)", style="bold yellow")
                
                if session["focus"]:
                    console.print(f"Focus: {', '.join(session['focus'])}", style="italic cyan")
                
                # Warm-up
                if session["warm_up"]:
                    console.print("\n🌤️  Warm-up:", style="bold magenta")
                    for pose in session["warm_up"]:
                        duration = pose.get("duration", 30)
                        console.print(f"  • {pose['name']} ({duration}s) - {pose['benefits']}", style="green")
                
                # Main practice
                if session["main_practice"]:
                    console.print("\n🔥 Main Practice:", style="bold magenta")
                    for pose in session["main_practice"]:
                        if "duration" in pose:
                            console.print(f"  • {pose['name']} ({pose['duration']}s) - {pose['benefits']}", style="green")
                        elif "repetitions" in pose:
                            console.print(f"  • {pose['name']} ({pose['repetitions']} reps) - {pose['benefits']}", style="green")
                
                # Cool-down
                if session["cool_down"]:
                    console.print("\n❄️  Cool-down:", style="bold magenta")
                    for pose in session["cool_down"]:
                        duration = pose.get("duration", 30)
                        console.print(f"  • {pose['name']} ({duration}s) - {pose['benefits']}", style="green")
    
    def get_todays_yoga_session(self, user: User) -> Optional[Dict]:
        """Get today's yoga session"""
        plan = self.load_yoga_plan(user.id)
        
        if not plan:
            return None
        
        today = datetime.now().strftime("%A").lower()
        return plan["sessions"].get(today)