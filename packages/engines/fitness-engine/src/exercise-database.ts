import type {
  BodyPart,
  EquipmentType,
  ExerciseDefinition,
  FitnessLevel,
  GoalType,
} from "@aura/types";

const EXERCISES: ExerciseDefinition[] = [
  {
    name: "Push-ups",
    description: "Classic bodyweight chest exercise.",
    equipment: ["bodyweight"],
    bodyParts: ["chest", "arms", "core"],
    goals: ["muscle_gain", "strength", "endurance"],
    difficulty: "beginner",
    caloriesPerMinute: 8,
    instructions: [
      "Start in a plank position.",
      "Lower until your chest is close to the floor.",
      "Press back to the top with a straight body line.",
    ],
    tips: ["Keep your core tight.", "Do not flare your elbows too wide."],
    variations: ["Incline Push-ups", "Decline Push-ups", "Close Grip Push-ups"],
  },
  {
    name: "Incline Push-ups",
    description: "An easier push-up variation using an elevated surface.",
    equipment: ["bodyweight"],
    bodyParts: ["chest", "arms", "core"],
    goals: ["muscle_gain", "strength", "endurance"],
    difficulty: "beginner",
    caloriesPerMinute: 6,
    instructions: ["Place hands on a bench or step.", "Lower with control.", "Press back up."],
    tips: ["Keep hips from sagging.", "Use this to build push-up strength."],
  },
  {
    name: "Decline Push-ups",
    description: "A harder push-up variation with feet elevated.",
    equipment: ["bodyweight"],
    bodyParts: ["chest", "shoulders", "arms", "core"],
    goals: ["muscle_gain", "strength"],
    difficulty: "advanced",
    caloriesPerMinute: 9,
    instructions: ["Elevate your feet.", "Lower under control.", "Press back to the top."],
    tips: ["Keep neck neutral.", "Stop before shoulder discomfort."],
  },
  {
    name: "Dumbbell Flyes",
    description: "Chest isolation exercise with dumbbells.",
    equipment: ["dumbbells"],
    bodyParts: ["chest"],
    goals: ["muscle_gain"],
    difficulty: "intermediate",
    caloriesPerMinute: 5,
    instructions: ["Lie on a bench holding dumbbells over your chest.", "Open arms in an arc.", "Squeeze chest to return."],
    tips: ["Keep a slight bend in the elbows.", "Do not go too heavy."],
  },
  {
    name: "Dumbbell Press",
    description: "Compound chest press with dumbbells.",
    equipment: ["dumbbells"],
    bodyParts: ["chest", "arms", "shoulders"],
    goals: ["muscle_gain", "strength"],
    difficulty: "intermediate",
    caloriesPerMinute: 6,
    instructions: ["Lie on a bench with dumbbells at chest level.", "Press overhead.", "Lower with control."],
    tips: ["Keep wrists stacked.", "Drive through evenly on both sides."],
  },
  {
    name: "Bench Press",
    description: "Classic chest exercise with a barbell or machine.",
    equipment: ["barbell", "machine"],
    bodyParts: ["chest", "arms", "shoulders"],
    goals: ["muscle_gain", "strength"],
    difficulty: "intermediate",
    caloriesPerMinute: 6,
    instructions: ["Grip the bar slightly wider than shoulders.", "Lower to the chest.", "Press back to lockout."],
    tips: ["Keep shoulder blades tight.", "Use a spotter for heavy sets."],
  },
  {
    name: "Chest Dips",
    description: "Bodyweight dip variation that biases the chest.",
    equipment: ["bodyweight"],
    bodyParts: ["chest", "arms", "shoulders"],
    goals: ["muscle_gain", "strength"],
    difficulty: "advanced",
    caloriesPerMinute: 8,
    instructions: ["Support yourself on parallel bars.", "Lean slightly forward as you lower.", "Press back up."],
    tips: ["Keep shoulders controlled.", "Reduce range if shoulder pain appears."],
  },
  {
    name: "Cable Flyes",
    description: "Chest isolation exercise using cables.",
    equipment: ["machine"],
    bodyParts: ["chest"],
    goals: ["muscle_gain"],
    difficulty: "intermediate",
    caloriesPerMinute: 5,
    instructions: ["Stand between cable stacks.", "Sweep hands together in an arc.", "Return slowly."],
    tips: ["Control the eccentric.", "Keep chest lifted."],
  },
  {
    name: "Pull-ups",
    description: "Bodyweight back exercise.",
    equipment: ["bodyweight"],
    bodyParts: ["back", "arms"],
    goals: ["muscle_gain", "strength"],
    difficulty: "intermediate",
    caloriesPerMinute: 9,
    instructions: ["Hang from a bar with an overhand grip.", "Pull chin over the bar.", "Lower under control."],
    tips: ["Avoid kipping unless programmed.", "Use full range of motion."],
  },
  {
    name: "Bent-over Rows",
    description: "Back exercise with barbell or dumbbells.",
    equipment: ["barbell", "dumbbells"],
    bodyParts: ["back", "arms"],
    goals: ["muscle_gain", "strength"],
    difficulty: "intermediate",
    caloriesPerMinute: 7,
    instructions: ["Hinge at the hips.", "Row the weight to your torso.", "Lower with control."],
    tips: ["Keep your spine neutral.", "Do not jerk the weight."],
  },
  {
    name: "Lat Pulldowns",
    description: "Machine-based back exercise.",
    equipment: ["machine"],
    bodyParts: ["back", "arms"],
    goals: ["muscle_gain", "strength"],
    difficulty: "intermediate",
    caloriesPerMinute: 6,
    instructions: ["Sit at the station with a wide grip.", "Pull the bar to your upper chest.", "Return slowly."],
    tips: ["Keep chest up.", "Do not use momentum."],
  },
  {
    name: "Seated Rows",
    description: "Cable row for mid-back strength.",
    equipment: ["machine"],
    bodyParts: ["back", "arms"],
    goals: ["muscle_gain", "strength"],
    difficulty: "intermediate",
    caloriesPerMinute: 6,
    instructions: ["Sit tall with feet braced.", "Pull the handle to your torso.", "Extend arms under control."],
    tips: ["Squeeze shoulder blades.", "Avoid leaning back too far."],
  },
  {
    name: "Reverse Flyes",
    description: "Upper-back and rear-delt movement.",
    equipment: ["dumbbells"],
    bodyParts: ["back", "shoulders"],
    goals: ["muscle_gain"],
    difficulty: "beginner",
    caloriesPerMinute: 4,
    instructions: ["Hinge at the hips.", "Raise arms out to the sides.", "Lower with control."],
    tips: ["Use light weights.", "Move through the rear delts."],
  },
  {
    name: "Superman",
    description: "Bodyweight lower-back exercise.",
    equipment: ["bodyweight"],
    bodyParts: ["back", "core"],
    goals: ["muscle_gain", "strength"],
    difficulty: "beginner",
    caloriesPerMinute: 5,
    instructions: ["Lie face down.", "Lift arms and legs together.", "Pause before lowering."],
    tips: ["Keep gaze down.", "Do not force extra range."],
  },
  {
    name: "Deadlifts",
    description: "Full-body compound hinge exercise.",
    equipment: ["barbell", "dumbbells"],
    bodyParts: ["back", "legs", "core"],
    goals: ["muscle_gain", "strength"],
    difficulty: "advanced",
    caloriesPerMinute: 8,
    instructions: ["Set your grip and brace.", "Push through the floor to stand.", "Lower by hinging at the hips."],
    tips: ["Keep the bar close.", "Do not round your back."],
  },
  {
    name: "Squats",
    description: "Fundamental lower-body exercise.",
    equipment: ["bodyweight", "barbell", "dumbbells"],
    bodyParts: ["legs", "core"],
    goals: ["muscle_gain", "strength", "endurance"],
    difficulty: "beginner",
    caloriesPerMinute: 10,
    instructions: ["Stand shoulder-width apart.", "Sit hips back and down.", "Drive through the feet to stand."],
    tips: ["Keep knees tracking over toes.", "Maintain a neutral torso."],
    variations: ["Jump Squats", "Bulgarian Split Squats", "Sumo Squats"],
  },
  {
    name: "Lunges",
    description: "Single-leg lower-body exercise.",
    equipment: ["bodyweight", "dumbbells"],
    bodyParts: ["legs", "core"],
    goals: ["muscle_gain", "strength", "endurance"],
    difficulty: "beginner",
    caloriesPerMinute: 8,
    instructions: ["Step forward into a split stance.", "Lower both knees.", "Push back to start."],
    tips: ["Stay tall.", "Keep the front knee over the ankle."],
  },
  {
    name: "Calf Raises",
    description: "Simple calf strengthening movement.",
    equipment: ["bodyweight", "dumbbells"],
    bodyParts: ["legs"],
    goals: ["muscle_gain", "strength"],
    difficulty: "beginner",
    caloriesPerMinute: 4,
    instructions: ["Stand tall.", "Rise onto your toes.", "Lower under control."],
    tips: ["Pause at the top.", "Use a full range of motion."],
  },
  {
    name: "Wall Sits",
    description: "Isometric lower-body hold.",
    equipment: ["bodyweight"],
    bodyParts: ["legs", "core"],
    goals: ["muscle_gain", "strength", "endurance"],
    difficulty: "beginner",
    caloriesPerMinute: 6,
    instructions: ["Slide your back down a wall.", "Hold thighs near parallel.", "Keep pressure through the feet."],
    tips: ["Do not rest hands on thighs.", "Breathe steadily."],
  },
  {
    name: "Step-ups",
    description: "Leg exercise using a bench or step.",
    equipment: ["bodyweight", "dumbbells"],
    bodyParts: ["legs", "core"],
    goals: ["muscle_gain", "strength", "endurance"],
    difficulty: "beginner",
    caloriesPerMinute: 7,
    instructions: ["Step one foot onto a box.", "Drive up to stand.", "Lower with control."],
    tips: ["Avoid pushing off the rear foot.", "Keep hips level."],
  },
  {
    name: "Leg Press",
    description: "Machine lower-body press.",
    equipment: ["machine"],
    bodyParts: ["legs"],
    goals: ["muscle_gain", "strength"],
    difficulty: "intermediate",
    caloriesPerMinute: 6,
    instructions: ["Sit in the machine.", "Lower with control.", "Press back without locking out."],
    tips: ["Keep knees tracking forward.", "Use a controlled tempo."],
  },
  {
    name: "Bulgarian Split Squats",
    description: "Rear-foot elevated single-leg squat.",
    equipment: ["bodyweight", "dumbbells"],
    bodyParts: ["legs", "core"],
    goals: ["muscle_gain", "strength"],
    difficulty: "advanced",
    caloriesPerMinute: 8,
    instructions: ["Elevate the rear foot.", "Lower the front leg into a squat.", "Drive back up."],
    tips: ["Stay balanced.", "Shorten the range if needed at first."],
  },
  {
    name: "Shoulder Press",
    description: "Overhead press for shoulders.",
    equipment: ["dumbbells", "barbell"],
    bodyParts: ["shoulders", "arms"],
    goals: ["muscle_gain", "strength"],
    difficulty: "intermediate",
    caloriesPerMinute: 6,
    instructions: ["Start at shoulder height.", "Press overhead.", "Lower back to the start."],
    tips: ["Do not over-arch the low back.", "Keep wrists stacked."],
  },
  {
    name: "Lateral Raises",
    description: "Shoulder isolation exercise.",
    equipment: ["dumbbells"],
    bodyParts: ["shoulders"],
    goals: ["muscle_gain"],
    difficulty: "beginner",
    caloriesPerMinute: 4,
    instructions: ["Raise dumbbells to shoulder height.", "Pause briefly.", "Lower slowly."],
    tips: ["Use light weights.", "Lead with the elbows."],
  },
  {
    name: "Tricep Dips",
    description: "Bodyweight tricep movement using a bench or chair.",
    equipment: ["bodyweight"],
    bodyParts: ["arms"],
    goals: ["muscle_gain", "strength"],
    difficulty: "intermediate",
    caloriesPerMinute: 6,
    instructions: ["Place hands on a bench behind you.", "Lower by bending the elbows.", "Press back up."],
    tips: ["Stay close to the bench.", "Reduce depth if shoulders feel strained."],
  },
  {
    name: "Close Grip Push-ups",
    description: "Push-up variation emphasizing the triceps.",
    equipment: ["bodyweight"],
    bodyParts: ["arms", "chest"],
    goals: ["muscle_gain", "strength"],
    difficulty: "intermediate",
    caloriesPerMinute: 7,
    instructions: ["Bring hands closer than shoulder-width.", "Lower to the floor.", "Press back up."],
    tips: ["Keep elbows close to the body.", "Move as one line."],
  },
  {
    name: "Bicep Curls",
    description: "Basic biceps exercise.",
    equipment: ["dumbbells", "resistance_bands"],
    bodyParts: ["arms"],
    goals: ["muscle_gain"],
    difficulty: "beginner",
    caloriesPerMinute: 4,
    instructions: ["Start with arms at your sides.", "Curl to shoulder height.", "Lower slowly."],
    tips: ["Avoid swinging.", "Keep elbows pinned in place."],
  },
  {
    name: "Hammer Curls",
    description: "Neutral-grip curl variation.",
    equipment: ["dumbbells"],
    bodyParts: ["arms"],
    goals: ["muscle_gain"],
    difficulty: "beginner",
    caloriesPerMinute: 4,
    instructions: ["Hold dumbbells with palms facing in.", "Curl upward.", "Lower with control."],
    tips: ["Stay tall.", "Do not rotate the wrists."],
  },
  {
    name: "Overhead Tricep Extension",
    description: "Tricep isolation exercise overhead.",
    equipment: ["dumbbells"],
    bodyParts: ["arms"],
    goals: ["muscle_gain"],
    difficulty: "intermediate",
    caloriesPerMinute: 5,
    instructions: ["Hold a dumbbell overhead.", "Lower behind the head.", "Extend to the top."],
    tips: ["Keep elbows tucked.", "Move under control."],
  },
  {
    name: "Resistance Band Curls",
    description: "Biceps curl using a resistance band.",
    equipment: ["resistance_bands"],
    bodyParts: ["arms"],
    goals: ["muscle_gain"],
    difficulty: "beginner",
    caloriesPerMinute: 4,
    instructions: ["Stand on the band.", "Curl toward the shoulders.", "Lower slowly."],
    tips: ["Keep tension through the full rep.", "Do not rock backward."],
  },
  {
    name: "Cable Tricep Pushdowns",
    description: "Cable machine tricep exercise.",
    equipment: ["machine"],
    bodyParts: ["arms"],
    goals: ["muscle_gain"],
    difficulty: "intermediate",
    caloriesPerMinute: 5,
    instructions: ["Set elbows by your sides.", "Press the handle down.", "Return slowly."],
    tips: ["Do not let the elbows drift forward.", "Use full extension."],
  },
  {
    name: "Plank",
    description: "Isometric core hold.",
    equipment: ["bodyweight"],
    bodyParts: ["core"],
    goals: ["strength", "endurance"],
    difficulty: "beginner",
    caloriesPerMinute: 5,
    instructions: ["Hold a straight body line.", "Brace the abs.", "Breathe while holding."],
    tips: ["Do not let hips sag.", "Keep shoulders over elbows."],
    variations: ["Side Plank"],
  },
  {
    name: "Crunches",
    description: "Basic abdominal exercise.",
    equipment: ["bodyweight"],
    bodyParts: ["core"],
    goals: ["muscle_gain", "strength"],
    difficulty: "beginner",
    caloriesPerMinute: 6,
    instructions: ["Lie on your back with knees bent.", "Lift shoulder blades off the floor.", "Lower slowly."],
    tips: ["Do not pull on the neck.", "Keep the movement small and controlled."],
  },
  {
    name: "Mountain Climbers",
    description: "Dynamic core and cardio movement.",
    equipment: ["bodyweight"],
    bodyParts: ["core", "cardio"],
    goals: ["endurance", "fat_loss"],
    difficulty: "intermediate",
    caloriesPerMinute: 12,
    instructions: ["Start in a plank.", "Drive knees toward the chest.", "Alternate quickly with control."],
    tips: ["Keep shoulders stable.", "Do not bounce the hips."],
  },
  {
    name: "Russian Twists",
    description: "Rotational core exercise.",
    equipment: ["bodyweight", "dumbbells"],
    bodyParts: ["core"],
    goals: ["muscle_gain", "strength"],
    difficulty: "intermediate",
    caloriesPerMinute: 6,
    instructions: ["Sit with your torso leaned back.", "Rotate side to side.", "Keep the core braced."],
    tips: ["Move from the trunk.", "Slow down if your back rounds."],
  },
  {
    name: "Dead Bug",
    description: "Core stability drill.",
    equipment: ["bodyweight"],
    bodyParts: ["core"],
    goals: ["strength"],
    difficulty: "beginner",
    caloriesPerMinute: 4,
    instructions: ["Lie on your back with arms and knees up.", "Extend the opposite arm and leg.", "Return and switch sides."],
    tips: ["Keep the low back down.", "Move slowly."],
  },
  {
    name: "Hanging Leg Raises",
    description: "Advanced hanging core exercise.",
    equipment: ["bodyweight"],
    bodyParts: ["core"],
    goals: ["muscle_gain", "strength"],
    difficulty: "advanced",
    caloriesPerMinute: 7,
    instructions: ["Hang from a bar.", "Lift legs toward hip height.", "Lower with control."],
    tips: ["Do not swing.", "Bend knees if needed."],
  },
  {
    name: "Cable Woodchops",
    description: "Cable rotation for the core.",
    equipment: ["machine"],
    bodyParts: ["core"],
    goals: ["muscle_gain", "strength"],
    difficulty: "intermediate",
    caloriesPerMinute: 6,
    instructions: ["Set the cable high or low.", "Rotate through the torso.", "Return under control."],
    tips: ["Keep hips stable.", "Control the finish position."],
  },
  {
    name: "Burpees",
    description: "Full-body conditioning exercise.",
    equipment: ["bodyweight"],
    bodyParts: ["full_body", "cardio"],
    goals: ["endurance", "fat_loss"],
    difficulty: "intermediate",
    caloriesPerMinute: 15,
    instructions: ["Drop to the floor.", "Return to standing.", "Finish with a jump."],
    tips: ["Keep transitions smooth.", "Scale by removing the jump if needed."],
  },
  {
    name: "Jumping Jacks",
    description: "Basic cardio warm-up movement.",
    equipment: ["bodyweight"],
    bodyParts: ["cardio"],
    goals: ["endurance", "fat_loss"],
    difficulty: "beginner",
    caloriesPerMinute: 8,
    instructions: ["Jump feet apart and hands overhead.", "Return to the start.", "Repeat rhythmically."],
    tips: ["Land softly.", "Maintain a steady pace."],
  },
];

const HOME_EQUIPMENT: EquipmentType[] = ["dumbbells", "resistance_bands", "kettlebell"];
const GYM_EQUIPMENT: EquipmentType[] = ["barbell", "machine"];

export const EXERCISE_LIBRARY = EXERCISES;

export function getExercisesByEquipment(equipment: EquipmentType): ExerciseDefinition[] {
  return EXERCISES.filter((exercise) => exercise.equipment.includes(equipment));
}

export function getExercisesByBodyPart(bodyPart: BodyPart): ExerciseDefinition[] {
  return EXERCISES.filter((exercise) => exercise.bodyParts.includes(bodyPart));
}

export function getExercisesByGoal(goal: GoalType): ExerciseDefinition[] {
  return EXERCISES.filter((exercise) => exercise.goals.includes(goal));
}

export function getExercisesByDifficulty(difficulty: FitnessLevel): ExerciseDefinition[] {
  return EXERCISES.filter((exercise) => exercise.difficulty === difficulty);
}

export function getExercise(name: string): ExerciseDefinition | undefined {
  const normalized = name.trim().toLowerCase();
  return EXERCISES.find((exercise) => exercise.name.toLowerCase() === normalized);
}

export function searchExercises(query: string): ExerciseDefinition[] {
  const normalized = query.trim().toLowerCase();
  return EXERCISES.filter((exercise) => {
    return (
      exercise.name.toLowerCase().includes(normalized) ||
      exercise.description.toLowerCase().includes(normalized) ||
      exercise.bodyParts.some((bodyPart) => bodyPart.includes(normalized)) ||
      exercise.goals.some((goal) => goal.includes(normalized))
    );
  });
}

export function getAvailableExercises(
  hasHomeEquipment: boolean,
  hasGymAccess: boolean,
): ExerciseDefinition[] {
  return EXERCISES.filter((exercise) => {
    if (exercise.equipment.includes("bodyweight")) {
      return true;
    }

    if (hasHomeEquipment && exercise.equipment.some((item) => HOME_EQUIPMENT.includes(item))) {
      return true;
    }

    if (hasGymAccess && exercise.equipment.some((item) => GYM_EQUIPMENT.includes(item))) {
      return true;
    }

    return false;
  });
}

export function getWorkoutSuggestions(params: {
  bodyParts: BodyPart[];
  goals: GoalType[];
  difficulty: FitnessLevel;
  equipmentAvailable: EquipmentType[];
}): ExerciseDefinition[] {
  const { bodyParts, goals, difficulty, equipmentAvailable } = params;

  return EXERCISES.filter((exercise) => {
    return (
      exercise.difficulty === difficulty &&
      exercise.bodyParts.some((bodyPart) => bodyParts.includes(bodyPart)) &&
      exercise.goals.some((goal) => goals.includes(goal)) &&
      exercise.equipment.some((equipment) => equipmentAvailable.includes(equipment))
    );
  });
}
