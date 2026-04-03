# YOGA Module Technical Overview

## Overview
The YOGA module provides comprehensive yoga practice capabilities including assessment, planning, and progress tracking. It is completely separate from the GYM module to allow independent development and usage.

## Key Components

### 1. Yoga Assessor (`src/yoga_assessor.py`)
Evaluates yoga proficiency through pose-based assessments.

**Key Classes:**
- `YogaAssessor`: Handles yoga evaluation

**Key Methods:**
- `conduct_assessment()`: Runs yoga assessment process
- `suggest_level_progression()`: Recommends level advancement
- `get_yoga_goals_for_level()`: Gets pose recommendations by level

**Assessment Categories:**
- Flexibility
- Balance
- Strength
- Endurance
- Meditation

**Yoga Goals:**
- Flexibility Enhancement
- Stress Reduction & Mental Clarity
- Posture Correction
- Balance & Stability
- Core Strengthening
- Spinal Health
- Detoxification & Organ Support

### 2. Yoga Planner (`src/yoga_planner.py`)
Generates personalized 6-day yoga plans.

**Key Classes:**
- `YogaPlanner`: Creates yoga plans

**Key Methods:**
- `create_yoga_plan()`: Generates personalized plans
- `load_yoga_plan()`: Retrieves existing plans
- `get_todays_yoga_session()`: Gets today's planned session

**Plan Structure:**
- 6-day weekly plans (Monday-Saturday)
- Structured sessions with warm-up, main practice, and cool-down
- Level-appropriate pose selection
- Goal-based pose recommendations

**Pose Categories:**
- Warm-up poses
- Standing poses
- Floor poses
- Cool-down poses

### 3. Yoga Tracker (`src/yoga_tracker.py`)
Tracks yoga practice sessions and progress.

**Key Classes:**
- `YogaTracker`: Main tracking component

**Key Methods:**
- `track_yoga_session()`: Logs yoga sessions
- `show_yoga_progress()`: Displays progress analytics
- `generate_yoga_progress_charts()`: Creates visualization charts
- `get_weekly_yoga_summary()`: Gets weekly practice summary

**Tracking Features:**
- Session duration and quality
- Calorie burn estimation
- Practice streak tracking
- Progress visualization

## Data Flow

1. **User Registration**: Yoga preference stored in user profile
2. **Yoga Assessment**: User yoga level determined and updated
3. **Plan Generation**: Personalized yoga plans created in `data/yoga_plans.json`
4. **Practice Execution**: Sessions logged in `data/yoga_logs.json`
5. **Progress Analysis**: Analytics generated and charts saved to `data/progress_charts/`

## Integration Points

- **Nutrition Tracker**: Calorie burn data integrated with nutrition balance
- **Level Advancement**: Progress data used for level recommendations
- **User Manager**: User data shared for profile management

## APIs for App Integration

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
yoga_tracker.show_yoga_progress(user)
```

## Yoga Levels and Goals

### Flexibility Enhancement
- **Beginner**: Seated forward bend, child's pose, cat-cow
- **Intermediate**: Triangle pose, pigeon pose, lizard
- **Expert**: Full splits, king pigeon, wheel pose

### Stress Reduction & Mental Clarity
- **Beginner**: Shavasana, Nadi Shodhana, Hatha yoga
- **Intermediate**: Vinyasa with breath, Yoga Nidra, Ujjayi
- **Expert**: Silent meditation, Kundalini kriyas, long Pranayama

### Posture Correction
- **Beginner**: Tadasana, bridge, cobra
- **Intermediate**: Warrior series, plank holds, dolphin
- **Expert**: Handstands, crow pose, deep backbends

### Balance & Stability
- **Beginner**: Tree pose, eagle arms seated
- **Intermediate**: Warrior III, dancer pose, one-leg plank
- **Expert**: Handstand, crow-to-headstand transitions

### Core Strengthening
- **Beginner**: Cat-cow crunches, boat pose, plank
- **Intermediate**: Leg raises, dolphin plank, side plank
- **Expert**: Vasisthasana, crow pose

### Spinal Health
- **Beginner**: Supine twist, cobra, supported bridge
- **Intermediate**: Locust, spinal wave, sphinx to cobra
- **Expert**: Wheel, full camel, shoulder stand series

### Detoxification & Organ Support
- **Beginner**: Easy seated twist, lion's breath
- **Intermediate**: Revolved triangle, Kapalbhati
- **Expert**: Advanced pranayama, Kriyas