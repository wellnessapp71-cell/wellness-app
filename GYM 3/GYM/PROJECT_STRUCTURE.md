# GYM AI CLI - Project Structure Overview

This document provides a comprehensive overview of the GYM AI CLI project structure for developers who will be integrating this CLI model into an application.

## 🏗️ Project Architecture

The GYM AI CLI is a modular Python application with three main components:

1. **GYM Module** - Traditional fitness training
2. **YOGA Module** - Yoga practice and flexibility training
3. **Nutrition-AI Module** - Nutrition tracking and calorie management

## 📁 Directory Structure

```
GYM/
├── main.py                 # Entry point and CLI interface
├── setup.py                # Installation script
├── requirements.txt        # Python dependencies
├── README.md               # Project documentation
├── QUICKSTART.md           # Quick start guide
├── TESTING.md              # Testing procedures
├── PROJECT_STRUCTURE.md    # This document
├── src/                    # Core source code
│   ├── user_manager.py        # User registration and management
│   ├── fitness_assessor.py    # GYM fitness level assessment
│   ├── workout_planner.py     # GYM workout plan generation
│   ├── exercise_database.py   # GYM exercise repository
│   ├── progress_tracker.py    # GYM progress tracking and analytics
│   ├── nutrition_tracker.py   # Nutrition tracking and calorie management
│   ├── yoga_assessor.py       # YOGA level assessment
│   ├── yoga_planner.py        # YOGA plan generation
│   ├── yoga_tracker.py        # YOGA progress tracking
│   └── realtime_guidance.py   # Camera-based form analysis (future)
├── data/                   # Data storage directory
│   ├── users.json             # User profiles
│   ├── workout_plans.json     # GYM workout plans
│   ├── workout_logs.json      # GYM workout logs
│   ├── yoga_plans.json        # YOGA practice plans
│   ├── yoga_logs.json         # YOGA practice logs
│   ├── nutrition_logs.json    # Nutrition tracking logs
│   └── progress_charts/       # Generated progress visualization charts
└── nutrition-ai/           # Separate nutrition AI module
    ├── README.md              # Nutrition AI documentation
    ├── api/                   # API endpoints
    ├── app/                   # Core application logic
    ├── calorie_query/         # Calorie database and estimation
    ├── chat_assistant/        # AI chatbot for nutrition queries
    └── cli/                   # CLI interface for nutrition AI
```

## 🧩 Core Modules

### 1. GYM Module (`src/`)

#### User Management (`src/user_manager.py`)
- **Purpose**: Handles user registration, authentication, and profile management
- **Key Features**:
  - User creation and data validation
  - Profile persistence in JSON format
  - User data retrieval and updates
- **Data Storage**: `data/users.json`

#### Fitness Assessment (`src/fitness_assessor.py`)
- **Purpose**: Evaluates user fitness level through rep-based questions
- **Key Features**:
  - 5 exercise assessments (push-ups, pull-ups, squats, plank, burpees)
  - 4 fitness levels (Beginner, Intermediate, Advanced, Expert)
  - Gender-weighted scoring system
- **Integration**: Works with [UserManager](file:///Users/shankarsingh/Desktop/GYM/src/user_manager.py#L44-L183) to update user fitness levels

#### Workout Planning (`src/workout_planner.py`)
- **Purpose**: Generates personalized 6-day workout plans
- **Key Features**:
  - Equipment-aware exercise selection
  - Goal-specific program generation
  - Adaptive plan creation based on fitness level
- **Data Storage**: `data/workout_plans.json`

#### Exercise Database (`src/exercise_database.py`)
- **Purpose**: Repository of 40+ exercises with variations
- **Key Features**:
  - Exercise categorization by equipment and body parts
  - Difficulty levels and calorie calculations
  - Exercise filtering based on user equipment access

#### Progress Tracking (`src/progress_tracker.py`)
- **Purpose**: Tracks workout completion and generates analytics
- **Key Features**:
  - Real-time workout logging
  - Adaptive workout intensity scaling
  - Progress visualization charts
  - Fatigue tracking and management
- **Data Storage**: `data/workout_logs.json`, `data/progress_charts/`

### 2. YOGA Module (`src/yoga_*.py`)

#### Yoga Assessment (`src/yoga_assessor.py`)
- **Purpose**: Evaluates yoga proficiency through pose-based questions
- **Key Features**:
  - 5 yoga assessment categories (flexibility, balance, strength, endurance, meditation)
  - 4 yoga levels (Beginner, Intermediate, Advanced, Expert)
  - Goal-specific pose recommendations
- **Integration**: Works with [UserManager](file:///Users/shankarsingh/Desktop/GYM/src/user_manager.py#L44-L183) to update user yoga levels

#### Yoga Planning (`src/yoga_planner.py`)
- **Purpose**: Generates personalized 6-day yoga plans
- **Key Features**:
  - Level-appropriate pose selection
  - Structured sessions (warm-up, main practice, cool-down)
  - Goal-based pose recommendations
- **Data Storage**: `data/yoga_plans.json`

#### Yoga Tracking (`src/yoga_tracker.py`)
- **Purpose**: Tracks yoga practice sessions and progress
- **Key Features**:
  - Session logging with duration and quality metrics
  - Streak tracking and motivation
  - Progress visualization charts
  - Integration with nutrition tracking
- **Data Storage**: `data/yoga_logs.json`, `data/progress_charts/`

### 3. Nutrition Module

#### Nutrition Tracking (`src/nutrition_tracker.py`)
- **Purpose**: Tracks calorie intake and provides nutritional analysis
- **Key Features**:
  - Meal logging by description or direct calorie input
  - Comprehensive food database with 150+ items
  - Calorie balance analysis for fitness goals
  - Integration with level advancement algorithms
- **Data Storage**: `data/nutrition_logs.json`

#### Nutrition-AI (`nutrition-ai/`)
- **Purpose**: Advanced nutrition analysis and AI-powered calorie estimation
- **Key Features**:
  - AI chatbot for precise calorie values
  - Advanced food database with detailed nutritional information
  - Meal planning and dietary recommendations
  - Integration suggestions for unrecognized foods

## 🔄 Integration Points

### Cross-Module Integration

1. **User Management**: Central component used by all modules
2. **Nutrition Tracking**: Integrated with both GYM and YOGA progress tracking
3. **Level Advancement**: Considers nutrition balance for optimal progression
4. **Data Persistence**: All modules store data in isolated JSON files

### Data Flow

```
User Registration → Fitness/Yoga Assessment → Plan Generation → 
Progress Tracking → Level Advancement → Analytics/Charts
                             ↑
                       Nutrition Data
```

## 📊 Data Storage

All data is stored in JSON format in the `data/` directory:

- **User Profiles**: `data/users.json`
- **GYM Plans**: `data/workout_plans.json`
- **GYM Logs**: `data/workout_logs.json`
- **YOGA Plans**: `data/yoga_plans.json`
- **YOGA Logs**: `data/yoga_logs.json`
- **Nutrition Logs**: `data/nutrition_logs.json`
- **Progress Charts**: `data/progress_charts/*.png`

## 🚀 Getting Started for App Integration

### 1. Core Dependencies
- Python 3.8+
- Rich library for terminal UI
- Pydantic for data validation
- Matplotlib for chart generation
- MediaPipe and OpenCV (for real-time guidance)

### 2. Installation
```bash
python setup.py
```

### 3. Running the Application
```bash
python main.py
```

### 4. Key Integration Points

#### For GYM Integration:
- Import `src.user_manager.UserManager` for user handling
- Use `src.fitness_assessor.FitnessAssessor` for fitness evaluation
- Leverage `src.workout_planner.WorkoutPlanner` for plan generation
- Utilize `src.progress_tracker.ProgressTracker` for progress monitoring

#### For YOGA Integration:
- Import `src.yoga_assessor.YogaAssessor` for yoga assessment
- Use `src.yoga_planner.YogaPlanner` for yoga plan generation
- Leverage `src.yoga_tracker.YogaTracker` for yoga progress tracking

#### For Nutrition Integration:
- Import `src.nutrition_tracker.NutritionTracker` for nutrition management
- Integrate with `nutrition-ai` module for precise calorie values

## 📈 Analytics and Reporting

The application provides comprehensive analytics through:
- Text-based reports in the terminal
- Generated charts stored in `data/progress_charts/`
- Historical data tracking for long-term progress monitoring

## 🎯 Future Enhancements

1. **Real-time Guidance**: Camera-based form analysis using MediaPipe
2. **Wearable Integration**: Connect with fitness trackers and smartwatches
3. **Social Features**: Community challenges and progress sharing
4. **Mobile App**: Cross-platform mobile application development

This structure provides a solid foundation for building a comprehensive fitness application that can be extended with additional features and integrations.