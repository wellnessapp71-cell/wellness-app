"""
Exercise Database Module
Contains comprehensive exercise database with categorization by equipment, body parts, and goals
"""

from typing import Dict, List, Optional
from pydantic import BaseModel
from enum import Enum

class EquipmentType(str, Enum):
    BODYWEIGHT = "bodyweight"
    DUMBBELLS = "dumbbells"
    BARBELL = "barbell"
    RESISTANCE_BANDS = "resistance_bands"
    KETTLEBELL = "kettlebell"
    MACHINE = "machine"
    CARDIO = "cardio"

class BodyPart(str, Enum):
    CHEST = "chest"
    BACK = "back"
    SHOULDERS = "shoulders"
    ARMS = "arms"
    LEGS = "legs"
    CORE = "core"
    CARDIO = "cardio"
    FULL_BODY = "full_body"

class GoalType(str, Enum):
    FAT_LOSS = "fat_loss"
    MUSCLE_GAIN = "muscle_gain"
    ENDURANCE = "endurance"
    STRENGTH = "strength"
    FLEXIBILITY = "flexibility"

class Exercise(BaseModel):
    """Exercise model with all properties"""
    name: str
    description: str
    equipment: List[EquipmentType]
    body_parts: List[BodyPart]
    goals: List[GoalType]
    difficulty: str  # beginner, intermediate, advanced
    calories_per_minute: float
    instructions: List[str]
    tips: List[str]
    variations: List[str] = []
    # Optional real-time tracking configuration
    rt_tracked_angles: Optional[List[Dict]] = None  # [{"points": ["LEFT_SHOULDER","LEFT_ELBOW","LEFT_WRIST"], "ideal_range": [45, 160]}]
    rt_accuracy_angle: Optional[Dict] = None       # {"angle": ["LEFT_SHOULDER","LEFT_ELBOW","LEFT_WRIST"], "min": 60, "max": 160}

class ExerciseDatabase:
    """Comprehensive exercise database"""
    
    def __init__(self):
        self.exercises = self._initialize_exercises()
        # Add cache for frequently accessed data
        self._equipment_cache = {}
        self._body_part_cache = {}
        self._goal_cache = {}
    
    def _initialize_exercises(self) -> Dict[str, Exercise]:
        """Initialize the exercise database"""
        exercises = {}
        
        # CHEST EXERCISES
        exercises["push_ups"] = Exercise(
            name="Push-ups",
            description="Classic bodyweight chest exercise",
            equipment=[EquipmentType.BODYWEIGHT],
            body_parts=[BodyPart.CHEST, BodyPart.ARMS, BodyPart.CORE],
            goals=[GoalType.MUSCLE_GAIN, GoalType.STRENGTH, GoalType.ENDURANCE],
            difficulty="beginner",
            calories_per_minute=8.0,
            instructions=[
                "Start in plank position with hands slightly wider than shoulders",
                "Lower your body until chest nearly touches the floor",
                "Push back up to starting position",
                "Keep core tight and body straight"
            ],
            tips=[
                "Keep elbows at 45-degree angle",
                "Don't let hips sag or pike up",
                "Breathe out on the way up"
            ],
            variations=["incline_push_ups", "decline_push_ups", "diamond_push_ups"],
            rt_tracked_angles=[
                {"points": ["LEFT_SHOULDER","LEFT_ELBOW","LEFT_WRIST"], "ideal_range": [70, 170]},
                {"points": ["RIGHT_SHOULDER","RIGHT_ELBOW","RIGHT_WRIST"], "ideal_range": [70, 170]}
            ],
            rt_accuracy_angle={"angle": ["LEFT_SHOULDER","LEFT_ELBOW","LEFT_WRIST"], "min": 70, "max": 170}
        )
        
        exercises["bench_press"] = Exercise(
            name="Bench Press",
            description="Classic chest exercise with barbell",
            equipment=[EquipmentType.BARBELL, EquipmentType.MACHINE],
            body_parts=[BodyPart.CHEST, BodyPart.ARMS, BodyPart.SHOULDERS],
            goals=[GoalType.MUSCLE_GAIN, GoalType.STRENGTH],
            difficulty="intermediate",
            calories_per_minute=6.0,
            instructions=[
                "Lie on bench with feet flat on floor",
                "Grip bar slightly wider than shoulders",
                "Lower bar to chest with control",
                "Press bar up to starting position"
            ],
            tips=[
                "Keep shoulder blades retracted",
                "Don't bounce the bar off chest",
                "Use spotter for heavy weights"
            ],
            rt_tracked_angles=[
                {"points": ["LEFT_SHOULDER","LEFT_ELBOW","LEFT_WRIST"], "ideal_range": [60, 160]}
            ],
            rt_accuracy_angle={"angle": ["LEFT_SHOULDER","LEFT_ELBOW","LEFT_WRIST"], "min": 60, "max": 160}
        )
        
        exercises["dumbbell_flyes"] = Exercise(
            name="Dumbbell Flyes",
            description="Isolation chest exercise with dumbbells",
            equipment=[EquipmentType.DUMBBELLS],
            body_parts=[BodyPart.CHEST],
            goals=[GoalType.MUSCLE_GAIN],
            difficulty="intermediate",
            calories_per_minute=5.0,
            instructions=[
                "Lie on bench holding dumbbells above chest",
                "Lower weights in wide arc until chest stretch",
                "Bring weights back together above chest",
                "Keep slight bend in elbows"
            ],
            tips=[
                "Control the weight, don't let gravity do the work",
                "Focus on chest squeeze at the top",
                "Don't go too heavy to maintain form"
            ],
            rt_tracked_angles=[
                {"points": ["LEFT_ELBOW","LEFT_SHOULDER","LEFT_HIP"], "ideal_range": [60, 140]}
            ],
            rt_accuracy_angle={"angle": ["LEFT_ELBOW","LEFT_SHOULDER","LEFT_HIP"], "min": 60, "max": 140}
        )
        
        # BACK EXERCISES
        exercises["pull_ups"] = Exercise(
            name="Pull-ups",
            description="Bodyweight back exercise",
            equipment=[EquipmentType.BODYWEIGHT],
            body_parts=[BodyPart.BACK, BodyPart.ARMS],
            goals=[GoalType.MUSCLE_GAIN, GoalType.STRENGTH],
            difficulty="intermediate",
            calories_per_minute=9.0,
            instructions=[
                "Hang from bar with overhand grip",
                "Pull body up until chin clears bar",
                "Lower with control to starting position",
                "Keep core engaged throughout"
            ],
            tips=[
                "Start with assisted pull-ups if needed",
                "Focus on pulling with back, not just arms",
                "Full range of motion is key"
            ],
            variations=["assisted_pull_ups", "wide_grip_pull_ups", "chin_ups"]
        )
        
        exercises["bent_over_rows"] = Exercise(
            name="Bent-over Rows",
            description="Back exercise with barbell or dumbbells",
            equipment=[EquipmentType.BARBELL, EquipmentType.DUMBBELLS],
            body_parts=[BodyPart.BACK, BodyPart.ARMS],
            goals=[GoalType.MUSCLE_GAIN, GoalType.STRENGTH],
            difficulty="intermediate",
            calories_per_minute=7.0,
            instructions=[
                "Stand with feet hip-width apart",
                "Hinge at hips, keeping back straight",
                "Pull weight to lower chest/upper abdomen",
                "Squeeze shoulder blades together"
            ],
            tips=[
                "Keep core tight to protect lower back",
                "Don't use momentum to lift weight",
                "Focus on pulling with back muscles"
            ]
        )
        
        # LEG EXERCISES
        exercises["squats"] = Exercise(
            name="Squats",
            description="Fundamental leg exercise",
            equipment=[EquipmentType.BODYWEIGHT, EquipmentType.BARBELL, EquipmentType.DUMBBELLS],
            body_parts=[BodyPart.LEGS, BodyPart.CORE],
            goals=[GoalType.MUSCLE_GAIN, GoalType.STRENGTH, GoalType.ENDURANCE],
            difficulty="beginner",
            calories_per_minute=10.0,
            instructions=[
                "Stand with feet shoulder-width apart",
                "Lower body as if sitting back into chair",
                "Go down until thighs parallel to floor",
                "Drive through heels to stand up"
            ],
            tips=[
                "Keep knees tracking over toes",
                "Maintain a neutral spine",
                "Engage core throughout movement",
                "Don't let knees cave inward"
            ],
            variations=["jump_squats", "single_leg_squats", "sumo_squats"],
            rt_tracked_angles=[
                {"points": ["LEFT_HIP","LEFT_KNEE","LEFT_ANKLE"], "ideal_range": [70, 170]},
                {"points": ["RIGHT_HIP","RIGHT_KNEE","RIGHT_ANKLE"], "ideal_range": [70, 170]}
            ],
            rt_accuracy_angle={"angle": ["LEFT_HIP","LEFT_KNEE","LEFT_ANKLE"], "min": 70, "max": 170}
        )
        
        # Additional exercises
        exercises["jump_squats"] = Exercise(
            name="Jump Squats",
            description="Explosive plyometric exercise",
            equipment=[EquipmentType.BODYWEIGHT],
            body_parts=[BodyPart.LEGS, BodyPart.CORE, BodyPart.CARDIO],
            goals=[GoalType.ENDURANCE, GoalType.STRENGTH],
            difficulty="intermediate",
            calories_per_minute=12.0,
            instructions=[
                "Start in squat position",
                "Explode upward jumping as high as possible",
                "Land softly and immediately go into next squat",
                "Keep core tight throughout"
            ],
            tips=[
                "Land softly on balls of feet",
                "Absorb impact with bent knees",
                "Maintain control throughout movement",
                "Progress gradually to avoid injury"
            ],
            rt_tracked_angles=[
                {"points": ["LEFT_HIP","LEFT_KNEE","LEFT_ANKLE"], "ideal_range": [70, 170]}
            ],
            rt_accuracy_angle={"angle": ["LEFT_HIP","LEFT_KNEE","LEFT_ANKLE"], "min": 70, "max": 170}
        )
        
        exercises["single_leg_squats"] = Exercise(
            name="Single Leg Squats",
            description="Advanced unilateral leg exercise",
            equipment=[EquipmentType.BODYWEIGHT],
            body_parts=[BodyPart.LEGS, BodyPart.CORE],
            goals=[GoalType.STRENGTH, GoalType.ENDURANCE],
            difficulty="advanced",
            calories_per_minute=9.0,
            instructions=[
                "Stand on one leg with other leg extended forward",
                "Lower body by bending standing leg",
                "Go down until thigh is parallel to floor",
                "Drive through heel to return to start"
            ],
            tips=[
                "Keep non-standing leg straight",
                "Maintain balance throughout movement",
                "Control descent to avoid falling",
                "Start with support if needed"
            ]
        )
        
        exercises["sumo_squats"] = Exercise(
            name="Sumo Squats",
            description="Wide stance squat variation targeting inner thighs",
            equipment=[EquipmentType.BODYWEIGHT, EquipmentType.BARBELL, EquipmentType.DUMBBELLS],
            body_parts=[BodyPart.LEGS, BodyPart.CORE],
            goals=[GoalType.MUSCLE_GAIN, GoalType.STRENGTH],
            difficulty="beginner",
            calories_per_minute=8.0,
            instructions=[
                "Stand with feet wider than shoulder-width apart",
                "Point toes outward at 45-degree angle",
                "Lower body by bending knees and pushing hips back",
                "Descend until thighs are parallel to floor",
                "Drive through heels to return to start"
            ],
            tips=[
                "Keep chest up throughout movement",
                "Push knees out to match toe angle",
                "Maintain a neutral spine",
                "Engage glutes at top of movement"
            ],
            rt_tracked_angles=[
                {"points": ["LEFT_HIP","LEFT_KNEE","LEFT_ANKLE"], "ideal_range": [70, 170]}
            ],
            rt_accuracy_angle={"angle": ["LEFT_HIP","LEFT_KNEE","LEFT_ANKLE"], "min": 70, "max": 170}
        )
        
        exercises["lunges"] = Exercise(
            name="Lunges",
            description="Unilateral leg exercise for strength and balance",
            equipment=[EquipmentType.BODYWEIGHT, EquipmentType.DUMBBELLS],
            body_parts=[BodyPart.LEGS, BodyPart.CORE],
            goals=[GoalType.MUSCLE_GAIN, GoalType.STRENGTH, GoalType.ENDURANCE],
            difficulty="beginner",
            calories_per_minute=8.0,
            instructions=[
                "Stand with feet together",
                "Step forward with one leg",
                "Lower body until both knees are at 90 degrees",
                "Push through front heel to return to start",
                "Repeat with other leg"
            ],
            tips=[
                "Keep front knee aligned with ankle",
                "Don't let back knee touch ground",
                "Maintain upright torso",
                "Control the movement throughout"
            ],
            variations=["reverse_lunges", "walking_lunges", "jumping_lunges"],
            rt_tracked_angles=[
                {"points": ["LEFT_HIP","LEFT_KNEE","LEFT_ANKLE"], "ideal_range": [70, 170]}
            ],
            rt_accuracy_angle={"angle": ["LEFT_HIP","LEFT_KNEE","LEFT_ANKLE"], "min": 70, "max": 170}
        )
        
        # ARM EXERCISES
        exercises["bicep_curls"] = Exercise(
            name="Bicep Curls",
            description="Arm exercise for biceps",
            equipment=[EquipmentType.DUMBBELLS, EquipmentType.RESISTANCE_BANDS],
            body_parts=[BodyPart.ARMS],
            goals=[GoalType.MUSCLE_GAIN],
            difficulty="beginner",
            calories_per_minute=4.0,
            instructions=[
                "Stand holding weights at sides",
                "Curl weights up to shoulders",
                "Squeeze biceps at top",
                "Lower with control"
            ],
            tips=[
                "Keep elbows at sides",
                "Don't swing the weights",
                "Full range of motion"
            ]
        )
        
        exercises["tricep_dips"] = Exercise(
            name="Tricep Dips",
            description="Bodyweight tricep exercise",
            equipment=[EquipmentType.BODYWEIGHT],
            body_parts=[BodyPart.ARMS],
            goals=[GoalType.MUSCLE_GAIN, GoalType.STRENGTH],
            difficulty="intermediate",
            calories_per_minute=6.0,
            instructions=[
                "Sit on edge of chair or bench",
                "Place hands beside hips",
                "Lower body by bending elbows",
                "Push back up to starting position"
            ],
            tips=[
                "Keep body close to chair",
                "Don't go too low if it hurts shoulders",
                "Use legs to assist if needed"
            ]
        )
        
        # CORE EXERCISES
        exercises["plank"] = Exercise(
            name="Plank",
            description="Isometric core exercise",
            equipment=[EquipmentType.BODYWEIGHT],
            body_parts=[BodyPart.CORE],
            goals=[GoalType.STRENGTH, GoalType.ENDURANCE],
            difficulty="beginner",
            calories_per_minute=5.0,
            instructions=[
                "Start in push-up position",
                "Lower to forearms",
                "Keep body straight from head to heels",
                "Hold position"
            ],
            tips=[
                "Don't let hips sag or pike up",
                "Breathe normally",
                "Engage core throughout"
            ],
            variations=["side_plank", "plank_up_downs", "plank_jacks"]
        )
        
        exercises["crunches"] = Exercise(
            name="Crunches",
            description="Basic abdominal exercise",
            equipment=[EquipmentType.BODYWEIGHT],
            body_parts=[BodyPart.CORE],
            goals=[GoalType.MUSCLE_GAIN, GoalType.STRENGTH],
            difficulty="beginner",
            calories_per_minute=6.0,
            instructions=[
                "Lie on back with knees bent",
                "Place hands behind head",
                "Lift shoulders off ground",
                "Lower with control"
            ],
            tips=[
                "Don't pull on neck",
                "Focus on lifting with abs",
                "Keep lower back on ground"
            ]
        )
        
        # CARDIO EXERCISES
        exercises["burpees"] = Exercise(
            name="Burpees",
            description="Full-body cardio exercise",
            equipment=[EquipmentType.BODYWEIGHT],
            body_parts=[BodyPart.FULL_BODY, BodyPart.CARDIO],
            goals=[GoalType.ENDURANCE, GoalType.FAT_LOSS],
            difficulty="intermediate",
            calories_per_minute=15.0,
            instructions=[
                "Start standing",
                "Drop to push-up position",
                "Do a push-up",
                "Jump feet to hands",
                "Jump up with arms overhead"
            ],
            tips=[
                "Maintain good form even when tired",
                "Modify by stepping instead of jumping",
                "Focus on smooth transitions"
            ]
        )
        
        exercises["jumping_jacks"] = Exercise(
            name="Jumping Jacks",
            description="Basic cardio exercise",
            equipment=[EquipmentType.BODYWEIGHT],
            body_parts=[BodyPart.CARDIO],
            goals=[GoalType.ENDURANCE, GoalType.FAT_LOSS],
            difficulty="beginner",
            calories_per_minute=8.0,
            instructions=[
                "Stand with feet together",
                "Jump feet apart while raising arms",
                "Jump back to starting position",
                "Repeat rhythmically"
            ],
            tips=[
                "Land softly on balls of feet",
                "Keep core engaged",
                "Maintain steady rhythm"
            ]
        )
        
        # SHOULDER EXERCISES
        exercises["shoulder_press"] = Exercise(
            name="Shoulder Press",
            description="Shoulder exercise with dumbbells",
            equipment=[EquipmentType.DUMBBELLS, EquipmentType.BARBELL],
            body_parts=[BodyPart.SHOULDERS, BodyPart.ARMS],
            goals=[GoalType.MUSCLE_GAIN, GoalType.STRENGTH],
            difficulty="intermediate",
            calories_per_minute=6.0,
            instructions=[
                "Sit or stand holding weights at shoulder level",
                "Press weights straight up overhead",
                "Lower with control to starting position",
                "Keep core engaged"
            ],
            tips=[
                "Don't arch back excessively",
                "Keep wrists straight",
                "Full range of motion"
            ]
        )
        
        exercises["lateral_raises"] = Exercise(
            name="Lateral Raises",
            description="Shoulder isolation exercise",
            equipment=[EquipmentType.DUMBBELLS],
            body_parts=[BodyPart.SHOULDERS],
            goals=[GoalType.MUSCLE_GAIN],
            difficulty="beginner",
            calories_per_minute=4.0,
            instructions=[
                "Stand holding weights at sides",
                "Raise arms out to sides to shoulder height",
                "Lower with control",
                "Keep slight bend in elbows"
            ],
            tips=[
                "Don't use momentum",
                "Control the weight on the way down",
                "Focus on shoulder muscles"
            ]
        )
        
        # ADDITIONAL CHEST EXERCISES
        exercises["incline_push_ups"] = Exercise(
            name="Incline Push-ups",
            description="Easier variation of push-ups",
            equipment=[EquipmentType.BODYWEIGHT],
            body_parts=[BodyPart.CHEST, BodyPart.ARMS],
            goals=[GoalType.MUSCLE_GAIN, GoalType.STRENGTH],
            difficulty="beginner",
            calories_per_minute=6.0,
            instructions=[
                "Place hands on elevated surface (bench, step)",
                "Keep body straight from head to heels",
                "Lower chest to surface",
                "Push back up to starting position"
            ],
            tips=[
                "Start with higher surface for easier version",
                "Keep core tight throughout",
                "Full range of motion"
            ]
        )
        
        exercises["decline_push_ups"] = Exercise(
            name="Decline Push-ups",
            description="Advanced variation of push-ups",
            equipment=[EquipmentType.BODYWEIGHT],
            body_parts=[BodyPart.CHEST, BodyPart.ARMS, BodyPart.SHOULDERS],
            goals=[GoalType.MUSCLE_GAIN, GoalType.STRENGTH],
            difficulty="advanced",
            calories_per_minute=10.0,
            instructions=[
                "Place feet on elevated surface",
                "Hands on ground, body at angle",
                "Lower chest to ground",
                "Push back up with control"
            ],
            tips=[
                "More challenging than regular push-ups",
                "Focuses more on upper chest",
                "Keep body straight"
            ]
        )
        
        exercises["dumbbell_press"] = Exercise(
            name="Dumbbell Press",
            description="Chest exercise with dumbbells",
            equipment=[EquipmentType.DUMBBELLS],
            body_parts=[BodyPart.CHEST, BodyPart.ARMS, BodyPart.SHOULDERS],
            goals=[GoalType.MUSCLE_GAIN, GoalType.STRENGTH],
            difficulty="intermediate",
            calories_per_minute=7.0,
            instructions=[
                "Lie on bench holding dumbbells at chest level",
                "Press weights up and together",
                "Lower with control to chest",
                "Keep shoulder blades retracted"
            ],
            tips=[
                "Control the weight throughout",
                "Don't bounce off chest",
                "Full range of motion"
            ]
        )
        
        exercises["chest_dips"] = Exercise(
            name="Chest Dips",
            description="Advanced chest exercise",
            equipment=[EquipmentType.BODYWEIGHT],
            body_parts=[BodyPart.CHEST, BodyPart.ARMS, BodyPart.SHOULDERS],
            goals=[GoalType.MUSCLE_GAIN, GoalType.STRENGTH],
            difficulty="advanced",
            calories_per_minute=9.0,
            instructions=[
                "Support body on parallel bars",
                "Lean forward slightly",
                "Lower body until chest stretch",
                "Push back up to starting position"
            ],
            tips=[
                "Lean forward to target chest",
                "Don't go too low if it hurts shoulders",
                "Use assistance if needed"
            ]
        )
        
        exercises["cable_flyes"] = Exercise(
            name="Cable Flyes",
            description="Chest isolation with cables",
            equipment=[EquipmentType.MACHINE],
            body_parts=[BodyPart.CHEST],
            goals=[GoalType.MUSCLE_GAIN],
            difficulty="intermediate",
            calories_per_minute=5.0,
            instructions=[
                "Stand between cable machines",
                "Hold handles at chest level",
                "Bring hands together in arc motion",
                "Return to starting position"
            ],
            tips=[
                "Keep slight bend in elbows",
                "Focus on chest squeeze",
                "Control the weight"
            ]
        )
        
        # ADDITIONAL BACK EXERCISES
        exercises["lat_pulldowns"] = Exercise(
            name="Lat Pulldowns",
            description="Back exercise with cable machine",
            equipment=[EquipmentType.MACHINE],
            body_parts=[BodyPart.BACK, BodyPart.ARMS],
            goals=[GoalType.MUSCLE_GAIN, GoalType.STRENGTH],
            difficulty="intermediate",
            calories_per_minute=6.0,
            instructions=[
                "Sit at lat pulldown machine",
                "Grip bar wider than shoulders",
                "Pull bar to upper chest",
                "Control the weight back up"
            ],
            tips=[
                "Don't use momentum",
                "Focus on pulling with back",
                "Keep chest up"
            ]
        )
        
        exercises["seated_rows"] = Exercise(
            name="Seated Rows",
            description="Back exercise with cable machine",
            equipment=[EquipmentType.MACHINE],
            body_parts=[BodyPart.BACK, BodyPart.ARMS],
            goals=[GoalType.MUSCLE_GAIN, GoalType.STRENGTH],
            difficulty="intermediate",
            calories_per_minute=6.0,
            instructions=[
                "Sit at cable row machine",
                "Grip handle with both hands",
                "Pull handle to lower chest",
                "Squeeze shoulder blades together"
            ],
            tips=[
                "Keep back straight",
                "Don't lean back excessively",
                "Focus on back muscles"
            ]
        )
        
        exercises["reverse_flyes"] = Exercise(
            name="Reverse Flyes",
            description="Upper back exercise",
            equipment=[EquipmentType.DUMBBELLS],
            body_parts=[BodyPart.BACK, BodyPart.SHOULDERS],
            goals=[GoalType.MUSCLE_GAIN],
            difficulty="beginner",
            calories_per_minute=4.0,
            instructions=[
                "Bend forward at hips",
                "Hold weights with arms hanging",
                "Raise arms out to sides",
                "Squeeze shoulder blades together"
            ],
            tips=[
                "Keep slight bend in elbows",
                "Don't use heavy weights",
                "Focus on upper back"
            ]
        )
        
        exercises["superman"] = Exercise(
            name="Superman",
            description="Lower back bodyweight exercise",
            equipment=[EquipmentType.BODYWEIGHT],
            body_parts=[BodyPart.BACK, BodyPart.CORE],
            goals=[GoalType.MUSCLE_GAIN, GoalType.STRENGTH],
            difficulty="beginner",
            calories_per_minute=5.0,
            instructions=[
                "Lie face down on ground",
                "Arms extended in front",
                "Lift chest and legs off ground",
                "Hold for 2-3 seconds, then lower"
            ],
            tips=[
                "Don't lift too high",
                "Focus on lower back",
                "Keep neck neutral"
            ]
        )
        
        exercises["deadlifts"] = Exercise(
            name="Deadlifts",
            description="Full body compound exercise",
            equipment=[EquipmentType.BARBELL, EquipmentType.DUMBBELLS],
            body_parts=[BodyPart.BACK, BodyPart.LEGS, BodyPart.CORE],
            goals=[GoalType.MUSCLE_GAIN, GoalType.STRENGTH],
            difficulty="advanced",
            calories_per_minute=8.0,
            instructions=[
                "Stand with feet hip-width apart",
                "Bend at hips and knees to lower weight",
                "Keep back straight throughout",
                "Drive through heels to stand up"
            ],
            tips=[
                "Keep weight close to body",
                "Don't round the back",
                "Start with light weight"
            ]
        )
        
        # ADDITIONAL LEG EXERCISES
        exercises["calf_raises"] = Exercise(
            name="Calf Raises",
            description="Calf muscle exercise",
            equipment=[EquipmentType.BODYWEIGHT, EquipmentType.DUMBBELLS],
            body_parts=[BodyPart.LEGS],
            goals=[GoalType.MUSCLE_GAIN, GoalType.STRENGTH],
            difficulty="beginner",
            calories_per_minute=4.0,
            instructions=[
                "Stand on edge of step or ground",
                "Rise up on toes as high as possible",
                "Lower heels below step level",
                "Repeat with control"
            ],
            tips=[
                "Full range of motion",
                "Control the movement",
                "Can hold weights for added resistance"
            ]
        )
        
        exercises["wall_sits"] = Exercise(
            name="Wall Sits",
            description="Isometric leg exercise",
            equipment=[EquipmentType.BODYWEIGHT],
            body_parts=[BodyPart.LEGS, BodyPart.CORE],
            goals=[GoalType.MUSCLE_GAIN, GoalType.STRENGTH, GoalType.ENDURANCE],
            difficulty="beginner",
            calories_per_minute=6.0,
            instructions=[
                "Stand with back against wall",
                "Slide down until thighs parallel to floor",
                "Hold position for specified time",
                "Keep back flat against wall"
            ],
            tips=[
                "Don't let knees go past toes",
                "Keep weight in heels",
                "Breathe normally"
            ]
        )
        
        exercises["step_ups"] = Exercise(
            name="Step-ups",
            description="Leg exercise using step or bench",
            equipment=[EquipmentType.BODYWEIGHT, EquipmentType.DUMBBELLS],
            body_parts=[BodyPart.LEGS, BodyPart.CORE],
            goals=[GoalType.MUSCLE_GAIN, GoalType.STRENGTH, GoalType.ENDURANCE],
            difficulty="beginner",
            calories_per_minute=7.0,
            instructions=[
                "Stand in front of step or bench",
                "Step up with one foot",
                "Bring other foot up to step",
                "Step down with control"
            ],
            tips=[
                "Keep knee over ankle",
                "Don't let knee cave inward",
                "Can hold weights for added resistance"
            ]
        )
        
        exercises["leg_press"] = Exercise(
            name="Leg Press",
            description="Leg exercise with machine",
            equipment=[EquipmentType.MACHINE],
            body_parts=[BodyPart.LEGS],
            goals=[GoalType.MUSCLE_GAIN, GoalType.STRENGTH],
            difficulty="intermediate",
            calories_per_minute=6.0,
            instructions=[
                "Sit in leg press machine",
                "Place feet on platform shoulder-width apart",
                "Lower weight until knees at 90 degrees",
                "Press weight back to starting position"
            ],
            tips=[
                "Don't lock knees at top",
                "Keep knees tracking over toes",
                "Full range of motion"
            ]
        )
        
        exercises["bulgarian_split_squats"] = Exercise(
            name="Bulgarian Split Squats",
            description="Advanced single-leg exercise",
            equipment=[EquipmentType.BODYWEIGHT, EquipmentType.DUMBBELLS],
            body_parts=[BodyPart.LEGS, BodyPart.CORE],
            goals=[GoalType.MUSCLE_GAIN, GoalType.STRENGTH],
            difficulty="advanced",
            calories_per_minute=8.0,
            instructions=[
                "Stand 2-3 feet in front of bench",
                "Place rear foot on bench behind you",
                "Lower body until front thigh parallel",
                "Push back up to starting position"
            ],
            tips=[
                "Keep front knee over ankle",
                "Don't let knee go past toes",
                "Can hold weights for added resistance"
            ]
        )
        
        # ADDITIONAL ARM EXERCISES
        exercises["hammer_curls"] = Exercise(
            name="Hammer Curls",
            description="Bicep exercise with neutral grip",
            equipment=[EquipmentType.DUMBBELLS],
            body_parts=[BodyPart.ARMS],
            goals=[GoalType.MUSCLE_GAIN],
            difficulty="beginner",
            calories_per_minute=4.0,
            instructions=[
                "Stand holding dumbbells at sides",
                "Keep palms facing each other",
                "Curl weights up to shoulders",
                "Lower with control"
            ],
            tips=[
                "Don't swing the weights",
                "Keep elbows at sides",
                "Focus on bicep contraction"
            ]
        )
        
        exercises["overhead_tricep_extension"] = Exercise(
            name="Overhead Tricep Extension",
            description="Tricep exercise with dumbbell",
            equipment=[EquipmentType.DUMBBELLS],
            body_parts=[BodyPart.ARMS],
            goals=[GoalType.MUSCLE_GAIN],
            difficulty="intermediate",
            calories_per_minute=5.0,
            instructions=[
                "Hold dumbbell with both hands overhead",
                "Lower weight behind head",
                "Extend arms back to starting position",
                "Keep elbows close to head"
            ],
            tips=[
                "Don't let elbows flare out",
                "Control the weight",
                "Full range of motion"
            ]
        )
        
        exercises["resistance_band_curls"] = Exercise(
            name="Resistance Band Curls",
            description="Bicep exercise with resistance band",
            equipment=[EquipmentType.RESISTANCE_BANDS],
            body_parts=[BodyPart.ARMS],
            goals=[GoalType.MUSCLE_GAIN],
            difficulty="beginner",
            calories_per_minute=4.0,
            instructions=[
                "Stand on resistance band",
                "Hold handles with palms up",
                "Curl hands up to shoulders",
                "Lower with control"
            ],
            tips=[
                "Keep elbows at sides",
                "Control the resistance",
                "Full range of motion"
            ]
        )
        
        exercises["close_grip_push_ups"] = Exercise(
            name="Close Grip Push-ups",
            description="Tricep-focused push-up variation",
            equipment=[EquipmentType.BODYWEIGHT],
            body_parts=[BodyPart.ARMS, BodyPart.CHEST],
            goals=[GoalType.MUSCLE_GAIN, GoalType.STRENGTH],
            difficulty="intermediate",
            calories_per_minute=7.0,
            instructions=[
                "Start in push-up position",
                "Place hands closer than shoulder-width",
                "Lower body until chest nearly touches hands",
                "Push back up to starting position"
            ],
            tips=[
                "Keep elbows close to body",
                "Focus on tricep engagement",
                "Full range of motion"
            ]
        )
        
        exercises["cable_tricep_pushdowns"] = Exercise(
            name="Cable Tricep Pushdowns",
            description="Tricep exercise with cable machine",
            equipment=[EquipmentType.MACHINE],
            body_parts=[BodyPart.ARMS],
            goals=[GoalType.MUSCLE_GAIN],
            difficulty="intermediate",
            calories_per_minute=5.0,
            instructions=[
                "Stand at cable machine",
                "Hold handle with overhand grip",
                "Push handle down until arms extended",
                "Return to starting position"
            ],
            tips=[
                "Keep elbows at sides",
                "Don't use momentum",
                "Focus on tricep contraction"
            ]
        )
        
        # ADDITIONAL CORE EXERCISES
        exercises["mountain_climbers"] = Exercise(
            name="Mountain Climbers",
            description="Dynamic core and cardio exercise",
            equipment=[EquipmentType.BODYWEIGHT],
            body_parts=[BodyPart.CORE, BodyPart.CARDIO],
            goals=[GoalType.ENDURANCE, GoalType.FAT_LOSS],
            difficulty="intermediate",
            calories_per_minute=12.0,
            instructions=[
                "Start in plank position",
                "Bring one knee to chest",
                "Quickly switch legs",
                "Continue alternating legs"
            ],
            tips=[
                "Keep core tight",
                "Maintain plank position",
                "Don't let hips rise"
            ]
        )
        
        exercises["russian_twists"] = Exercise(
            name="Russian Twists",
            description="Rotational core exercise",
            equipment=[EquipmentType.BODYWEIGHT, EquipmentType.DUMBBELLS],
            body_parts=[BodyPart.CORE],
            goals=[GoalType.MUSCLE_GAIN, GoalType.STRENGTH],
            difficulty="intermediate",
            calories_per_minute=6.0,
            instructions=[
                "Sit with knees bent, feet off ground",
                "Lean back slightly",
                "Rotate torso side to side",
                "Keep core engaged throughout"
            ],
            tips=[
                "Don't let feet touch ground",
                "Control the movement",
                "Can hold weight for added resistance"
            ]
        )
        
        exercises["dead_bug"] = Exercise(
            name="Dead Bug",
            description="Core stability exercise",
            equipment=[EquipmentType.BODYWEIGHT],
            body_parts=[BodyPart.CORE],
            goals=[GoalType.STRENGTH],
            difficulty="beginner",
            calories_per_minute=4.0,
            instructions=[
                "Lie on back with arms up",
                "Knees bent at 90 degrees",
                "Lower opposite arm and leg",
                "Return to starting position"
            ],
            tips=[
                "Keep lower back pressed to ground",
                "Move slowly and controlled",
                "Don't let back arch"
            ]
        )
        
        exercises["hanging_leg_raises"] = Exercise(
            name="Hanging Leg Raises",
            description="Advanced core exercise",
            equipment=[EquipmentType.BODYWEIGHT],
            body_parts=[BodyPart.CORE],
            goals=[GoalType.MUSCLE_GAIN, GoalType.STRENGTH],
            difficulty="advanced",
            calories_per_minute=7.0,
            instructions=[
                "Hang from pull-up bar",
                "Raise legs up to 90 degrees",
                "Lower with control",
                "Keep core tight throughout"
            ],
            tips=[
                "Don't swing the legs",
                "Control the movement",
                "Can bend knees if needed"
            ]
        )
        
        exercises["cable_woodchops"] = Exercise(
            name="Cable Woodchops",
            description="Rotational core exercise with cable",
            equipment=[EquipmentType.MACHINE],
            body_parts=[BodyPart.CORE],
            goals=[GoalType.MUSCLE_GAIN, GoalType.STRENGTH],
            difficulty="intermediate",
            calories_per_minute=6.0,
            instructions=[
                "Stand beside cable machine",
                "Hold handle with both hands",
                "Pull handle across body diagonally",
                "Return to starting position"
            ],
            tips=[
                "Keep core tight",
                "Rotate from the core",
                "Control the movement"
            ]
        )
        
        return exercises
    
    def get_exercises_by_equipment(self, equipment: EquipmentType) -> List[Exercise]:
        """Get exercises that can be done with specific equipment"""
        return [ex for ex in self.exercises.values() if equipment in ex.equipment]
    
    def get_exercises_by_body_part(self, body_part: BodyPart) -> List[Exercise]:
        """Get exercises targeting specific body part"""
        return [ex for ex in self.exercises.values() if body_part in ex.body_parts]
    
    def get_exercises_by_goal(self, goal: GoalType) -> List[Exercise]:
        """Get exercises suitable for specific goal"""
        return [ex for ex in self.exercises.values() if goal in ex.goals]
    
    def get_exercises_by_difficulty(self, difficulty: str) -> List[Exercise]:
        """Get exercises by difficulty level"""
        return [ex for ex in self.exercises.values() if ex.difficulty == difficulty]
    
    def get_exercise(self, name: str) -> Optional[Exercise]:
        """Get specific exercise by name"""
        return self.exercises.get(name.lower().replace(" ", "_"))
    
    def search_exercises(self, query: str) -> List[Exercise]:
        """Search exercises by name or description"""
        query = query.lower()
        results = []
        for ex in self.exercises.values():
            if (query in ex.name.lower() or 
                query in ex.description.lower() or
                any(query in part.value for part in ex.body_parts) or
                any(query in goal.value for goal in ex.goals)):
                results.append(ex)
        return results
    
    def get_available_exercises(self, has_home_equipment: bool, has_gym_access: bool) -> List[Exercise]:
        """Get exercises based on available equipment"""
        available_exercises = []
        
        for ex in self.exercises.values():
            # Always include bodyweight exercises
            if EquipmentType.BODYWEIGHT in ex.equipment:
                available_exercises.append(ex)
            # Include home equipment exercises if available
            elif has_home_equipment and any(eq in [EquipmentType.DUMBBELLS, EquipmentType.RESISTANCE_BANDS, EquipmentType.KETTLEBELL] for eq in ex.equipment):
                available_exercises.append(ex)
            # Include gym equipment exercises if available
            elif has_gym_access and any(eq in [EquipmentType.BARBELL, EquipmentType.MACHINE] for eq in ex.equipment):
                available_exercises.append(ex)
        
        return available_exercises
    
    def get_workout_suggestions(self, body_parts: List[BodyPart], goals: List[GoalType], 
                              difficulty: str, equipment_available: List[EquipmentType]) -> List[Exercise]:
        """Get workout suggestions based on multiple criteria"""
        suggestions = []
        
        for ex in self.exercises.values():
            # Check if exercise matches criteria
            if (ex.difficulty == difficulty and
                any(part in ex.body_parts for part in body_parts) and
                any(goal in ex.goals for goal in goals) and
                any(eq in ex.equipment for eq in equipment_available)):
                suggestions.append(ex)
        
        return suggestions
