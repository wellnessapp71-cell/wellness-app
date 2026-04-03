# GYM Module Technical Overview

## Overview
The GYM module is the core component of the GYM AI CLI application, providing traditional fitness training capabilities including workout planning, progress tracking, and fitness assessment.

## Key Components

### 1. User Manager (`src/user_manager.py`)
Manages user registration, authentication, and profile data.

**Key Classes:**
- `User`: Pydantic model for user data
- `UserManager`: Handles user operations

**Key Methods:**
- `create_user()`: Creates new user profiles
- `get_user()`: Retrieves user by name
- `update_user()`: Updates user data
- `delete_user()`: Removes user profiles

**Data Storage:**
- File: `data/users.json`
- Format: JSON with user profiles indexed by user ID

### 2. Fitness Assessor (`src/fitness_assessor.py`)
Evaluates user fitness levels through rep-based assessments.

**Key Classes:**
- `FitnessAssessor`: Handles fitness evaluation

**Key Methods:**
- `conduct_assessment()`: Runs fitness assessment process
- `suggest_level_progression()`: Recommends level advancement

**Assessment Exercises:**
- Push-ups
- Pull-ups
- Squats
- Plank hold
- Burpees

### 3. Workout Planner (`src/workout_planner.py`)
Generates personalized 6-day workout plans.

**Key Classes:**
- `WorkoutPlanner`: Creates workout plans
- `WeeklyWorkoutPlan`: Represents weekly plan structure
- `WorkoutSession`: Represents daily workout sessions

**Key Methods:**
- `create_workout_plan()`: Generates personalized plans
- `load_workout_plan()`: Retrieves existing plans

**Features:**
- Equipment-aware exercise selection
- Goal-specific program generation
- Adaptive difficulty based on fitness level

### 4. Exercise Database (`src/exercise_database.py`)
Repository of 40+ exercises with variations.

**Key Classes:**
- `Exercise`: Exercise data model
- `ExerciseDatabase`: Exercise repository

**Key Methods:**
- `get_exercises_by_equipment()`: Filters by equipment type
- `get_exercises_by_body_part()`: Filters by body part
- `get_exercises_by_difficulty()`: Filters by difficulty level

### 5. Progress Tracker (`src/progress_tracker.py`)
Tracks workout completion and generates analytics.

**Key Classes:**
- `ProgressTracker`: Main tracking component
- `WorkoutLog`: Workout log entries
- `FatigueTracker`: Tracks user fatigue
- `AdaptiveWorkoutManager`: Manages workout adaptation

**Key Methods:**
- `track_workout()`: Logs workout sessions
- `show_progress_reports()`: Displays progress analytics
- `generate_progress_charts()`: Creates visualization charts

## Data Flow

1. **User Registration**: User data stored in `data/users.json`
2. **Fitness Assessment**: User fitness level determined and updated
3. **Plan Generation**: Personalized workout plans created in `data/workout_plans.json`
4. **Workout Execution**: Sessions logged in `data/workout_logs.json`
5. **Progress Analysis**: Analytics generated and charts saved to `data/progress_charts/`

## Integration Points

- **Nutrition Tracker**: Calorie burn data integrated with nutrition balance
- **Level Advancement**: Progress data used for level recommendations
- **Real-time Guidance**: Future integration for form analysis

## APIs for App Integration

```python
# User Management
from src.user_manager import UserManager
user_manager = UserManager()
user = user_manager.create_user(user_data)

# Fitness Assessment
from src.fitness_assessor import FitnessAssessor
assessor = FitnessAssessor()
fitness_level = assessor.conduct_assessment(user)

# Workout Planning
from src.workout_planner import WorkoutPlanner
planner = WorkoutPlanner()
plan = planner.create_workout_plan(user)

# Progress Tracking
from src.progress_tracker import ProgressTracker
tracker = ProgressTracker()
tracker.track_workout(user)
```