# GYM AI CLI - Developer Guide

## Project Overview

The GYM AI CLI is a comprehensive fitness application with three distinct modules:
1. **GYM Module** - Traditional fitness training
2. **YOGA Module** - Yoga practice and flexibility training
3. **Nutrition Module** - Nutrition tracking and calorie management

This guide provides everything needed to understand and integrate the application into a new platform.

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- pip package manager

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd GYM

# Install dependencies
pip install -r requirements.txt

# For nutrition-ai module
cd nutrition-ai
pip install -r requirements.txt
cd ..

# Run the application
python main.py
```

## 🏗️ Architecture Overview

### Modular Design
The application follows a modular architecture with complete separation between GYM and YOGA modules:

```
GYM AI CLI
├── GYM Module (Traditional Fitness)
├── YOGA Module (Yoga Practice)
└── Nutrition Module (Calorie Tracking)
```

### Data Flow
```
User Registration → Assessment → Plan Generation → 
Progress Tracking → Level Advancement → Analytics
                             ↑
                       Nutrition Data
```

## 📁 File Structure

### Core Application (`src/`)
- `user_manager.py` - User registration and profile management
- `fitness_assessor.py` - GYM fitness level assessment
- `workout_planner.py` - GYM workout plan generation
- `exercise_database.py` - GYM exercise repository
- `progress_tracker.py` - GYM progress tracking and analytics
- `yoga_assessor.py` - YOGA level assessment
- `yoga_planner.py` - YOGA plan generation
- `yoga_tracker.py` - YOGA progress tracking
- `nutrition_tracker.py` - Nutrition tracking and calorie management
- `realtime_guidance.py` - Camera-based form analysis (future)

### Data Storage (`data/`)
- `users.json` - User profiles
- `workout_plans.json` - GYM workout plans
- `workout_logs.json` - GYM workout logs
- `yoga_plans.json` - YOGA practice plans
- `yoga_logs.json` - YOGA practice logs
- `nutrition_logs.json` - Nutrition tracking logs
- `progress_charts/` - Generated progress visualization charts

### External Modules
- `nutrition-ai/` - Advanced nutrition AI module

## 🔧 Key APIs for Integration

### User Management
```python
from src.user_manager import UserManager, User

# Create user manager
user_manager = UserManager()

# Create new user
user_data = {
    "name": "John Doe",
    "age": 30,
    "gender": "male",
    "current_weight": 75.0,
    "target_weight": 70.0,
    "has_home_equipment": True,
    "has_gym_access": False,
    "goals": ["fat_loss"],
    "fitness_type": "gym"  # or "yoga" or "mixed"
}
user = user_manager.create_user(user_data)

# Retrieve user
user = user_manager.get_user("John Doe")

# Update user
user.fitness_level = "intermediate"
user_manager.update_user(user)
```

### GYM Module Integration
```python
# Fitness Assessment
from src.fitness_assessor import FitnessAssessor
assessor = FitnessAssessor()
fitness_level = assessor.conduct_assessment(user)

# Workout Planning
from src.workout_planner import WorkoutPlanner
planner = WorkoutPlanner()
workout_plan = planner.create_workout_plan(user, session_minutes=45)

# Progress Tracking
from src.progress_tracker import ProgressTracker
tracker = ProgressTracker()
tracker.track_workout(user)
```

### YOGA Module Integration
```python
# Yoga Assessment
from src.yoga_assessor import YogaAssessor
yoga_assessor = YogaAssessor()
yoga_level = yoga_assessor.conduct_assessment(user)

# Yoga Planning
from src.yoga_planner import YogaPlanner
yoga_planner = YogaPlanner()
yoga_plan = yoga_planner.create_yoga_plan(user, session_minutes=30)

# Yoga Tracking
from src.yoga_tracker import YogaTracker
yoga_tracker = YogaTracker()
yoga_tracker.track_yoga_session(user)
```

### Nutrition Integration
```python
# Nutrition Tracking
from src.nutrition_tracker import NutritionTracker
nutrition_tracker = NutritionTracker()

# Log meals
nutrition_tracker.log_meal(user, "2 boiled eggs, 1 slice toast", None)
nutrition_tracker.log_meal(user, None, 300.0)  # Direct calories

# View summary
nutrition_tracker.show_nutrition_summary(user)
```

## 🎯 Core Features

### 1. Multi-Modal Fitness
- **GYM Training**: Traditional weight training and bodyweight exercises
- **YOGA Practice**: Flexibility, balance, and meditation
- **Mixed Approach**: Combination of both

### 2. Intelligent Assessment
- **GYM**: Rep-based fitness evaluation
- **YOGA**: Pose-based proficiency assessment

### 3. Personalized Planning
- **Adaptive Plans**: Based on fitness level and goals
- **Equipment Awareness**: Plans adjusted for available equipment
- **Goal-Specific**: Fat loss, muscle gain, endurance, etc.

### 4. Progress Tracking
- **Real-time Logging**: Workout and yoga session tracking
- **Analytics**: Comprehensive progress reports
- **Visualization**: Generated charts and graphs
- **Streak Management**: Consistency tracking

### 5. Nutrition Integration
- **Meal Logging**: Description-based or direct calorie input
- **Calorie Balance**: Consumed vs. burned analysis
- **Goal Alignment**: Nutrition recommendations for fitness goals

## 📊 Data Models

### User Model
```python
class User(BaseModel):
    id: str
    name: str
    age: int
    gender: str
    current_weight: float
    target_weight: float
    has_home_equipment: bool
    has_gym_access: bool
    goals: List[str]
    fitness_level: str = "beginner"
    fitness_type: str = "gym"  # "gym", "yoga", or "mixed"
    workout_streak: int = 0
    total_workouts: int = 0
    # Nutrition tracking fields
    weekly_calorie_intake: float = 0.0
    weekly_calorie_burned: float = 0.0
    nutrition_goal: str = "maintain"
```

### Workout Plan Model
```python
class WeeklyWorkoutPlan:
    user_id: str
    created_at: str
    level: str
    sessions: Dict[str, WorkoutSession]
```

### Yoga Plan Model
```python
# Structure stored in yoga_plans.json
{
    "user_id": "user_1_john_doe",
    "level": "beginner",
    "sessions": {
        "monday": {
            "duration": 30,
            "warm_up": [...],
            "main_practice": [...],
            "cool_down": [...],
            "focus": ["Flexibility & Stretching"]
        }
    }
}
```

## 🔄 Integration Patterns

### 1. Cross-Module Data Sharing
All modules share user data through the `UserManager` but maintain separate:
- Plan files (`workout_plans.json` vs `yoga_plans.json`)
- Log files (`workout_logs.json` vs `yoga_logs.json`)
- Analytics data

### 2. Nutrition Integration
Both GYM and YOGA modules contribute to `weekly_calorie_burned` which is used by the nutrition tracker for balance analysis.

### 3. Level Advancement
Fitness progression considers both workout consistency and nutrition balance.

## 📈 Analytics and Reporting

### Progress Tracking Features
- Duration tracking
- Calorie burn estimation
- Quality ratings
- Completion percentages
- Streak management
- Historical data analysis

### Chart Generation
- Progress over time visualizations
- Weekly summary charts
- Quality distribution graphs
- Duration and calorie trends

## 🚀 Future Enhancements

### Real-time Guidance
- Camera-based form analysis
- Motion tracking with MediaPipe
- Real-time rep counting
- Adaptive workout adjustments

### Advanced Features
- Wearable device integration
- Social features and challenges
- Mobile application development
- AI coaching and motivation

## 🛠️ Troubleshooting

### Common Issues

1. **Missing Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Data File Corruption**
   - Check JSON syntax in data files
   - Backup files are stored in `data/backup/`

3. **Camera Issues (Real-time Guidance)**
   - Ensure MediaPipe and OpenCV are installed
   - Check camera permissions

### Data Management

- **Backup**: Automatic backups in `data/backup/`
- **Cleanup**: Remove old backup files periodically
- **Migration**: JSON format allows easy data migration

## 📚 Documentation Files

For detailed information on each module, refer to:
- `GYM_MODULE.md` - Detailed GYM module documentation
- `YOGA_MODULE.md` - Detailed YOGA module documentation
- `NUTRITION_MODULE.md` - Detailed Nutrition module documentation
- `PROJECT_STRUCTURE.md` - Complete project architecture overview

This comprehensive guide should provide all the information needed to understand, maintain, and extend the GYM AI CLI application.