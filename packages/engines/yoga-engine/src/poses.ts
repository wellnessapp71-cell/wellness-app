import type { FitnessLevel, GoalType, YogaPose } from "@aura/types";

export const YOGA_GOALS_BY_LEVEL: Record<string, Partial<Record<FitnessLevel, string[]>>> = {
  flexibility: {
    beginner: ["Seated forward bend", "Child's pose", "Cat-cow"],
    intermediate: ["Triangle pose", "Pigeon pose", "Lizard"],
    expert: ["Full splits", "King pigeon", "Wheel pose"],
  },
  stress_reduction: {
    beginner: ["Shavasana", "Nadi Shodhana", "Hatha yoga"],
    intermediate: ["Vinyasa with breath", "Yoga Nidra", "Ujjayi"],
    expert: ["Silent meditation", "Kundalini kriyas", "Long Pranayama"],
  },
  posture: {
    beginner: ["Tadasana", "Bridge", "Cobra"],
    intermediate: ["Warrior series", "Plank holds", "Dolphin"],
    expert: ["Handstands", "Crow pose", "Deep backbends"],
  },
  balance: {
    beginner: ["Tree pose", "Eagle arms seated"],
    intermediate: ["Warrior III", "Dancer pose", "One-leg plank"],
    expert: ["Handstand", "Crow-to-headstand transitions"],
  },
  core_strength: {
    beginner: ["Cat-cow crunches", "Boat pose", "Plank"],
    intermediate: ["Leg raises", "Dolphin plank", "Side plank"],
    expert: ["Vasisthasana", "Crow pose"],
  },
  spinal_health: {
    beginner: ["Supine twist", "Cobra", "Supported bridge"],
    intermediate: ["Locust", "Spinal wave", "Sphinx to cobra"],
    expert: ["Wheel", "Full camel", "Shoulder stand series"],
  },
  detoxification: {
    beginner: ["Easy seated twist", "Lion's breath"],
    intermediate: ["Revolved triangle", "Kapalbhati"],
    expert: ["Advanced pranayama", "Kriyas"],
  },
};

export const YOGA_POSE_LIBRARY: Record<
  FitnessLevel,
  {
    warmUp: YogaPose[];
    standing: YogaPose[];
    floor: YogaPose[];
    coolDown: YogaPose[];
  }
> = {
  beginner: {
    warmUp: [
      { name: "Mountain Pose (Tadasana)", durationSeconds: 30, benefits: "Improves posture and balance" },
      { name: "Neck Rolls", durationSeconds: 60, benefits: "Releases neck tension" },
      { name: "Shoulder Rolls", durationSeconds: 60, benefits: "Loosens shoulder joints" },
      { name: "Cat-Cow Stretch", durationSeconds: 60, benefits: "Warms up the spine" },
      { name: "Seated Side Stretch", durationSeconds: 60, benefits: "Stretches the side body" },
    ],
    standing: [
      { name: "Mountain Pose (Tadasana)", durationSeconds: 60, benefits: "Foundation pose" },
      { name: "Forward Fold (Uttanasana)", durationSeconds: 60, benefits: "Stretches hamstrings" },
      { name: "Halfway Lift", durationSeconds: 30, benefits: "Strengthens the back" },
      { name: "Chair Pose", durationSeconds: 30, benefits: "Strengthens the legs" },
      { name: "Tree Pose", durationSeconds: 30, benefits: "Improves balance" },
    ],
    floor: [
      { name: "Child's Pose", durationSeconds: 60, benefits: "Relaxes and stretches" },
      { name: "Cobra Pose", durationSeconds: 30, benefits: "Strengthens the spine" },
      { name: "Downward Dog", durationSeconds: 60, benefits: "Full-body stretch" },
      { name: "Bridge Pose", durationSeconds: 30, benefits: "Opens chest and hips" },
      { name: "Supine Twist", durationSeconds: 60, benefits: "Releases spinal tension" },
    ],
    coolDown: [
      { name: "Happy Baby Pose", durationSeconds: 60, benefits: "Releases hip tension" },
      { name: "Knee-to-Chest Pose", durationSeconds: 60, benefits: "Calms the nervous system" },
      { name: "Corpse Pose", durationSeconds: 180, benefits: "Deep relaxation" },
    ],
  },
  intermediate: {
    warmUp: [
      { name: "Sun Salutation A", repetitions: 3, benefits: "Dynamic warm-up" },
      { name: "Cat-Cow Flow", durationSeconds: 60, benefits: "Spinal mobility" },
      { name: "Thread the Needle", durationSeconds: 60, benefits: "Shoulder release" },
      { name: "Seated Spinal Twist", durationSeconds: 60, benefits: "Detoxifying twist" },
    ],
    standing: [
      { name: "Warrior I", durationSeconds: 30, benefits: "Strength and focus" },
      { name: "Warrior II", durationSeconds: 30, benefits: "Leg strength" },
      { name: "Triangle Pose", durationSeconds: 30, benefits: "Full-body stretch" },
      { name: "Extended Side Angle", durationSeconds: 30, benefits: "Hip opening" },
      { name: "Tree Pose", durationSeconds: 30, benefits: "Balance challenge" },
    ],
    floor: [
      { name: "Pigeon Pose", durationSeconds: 60, benefits: "Hip opener" },
      { name: "Plank Pose", durationSeconds: 30, benefits: "Core strength" },
      { name: "Side Plank", durationSeconds: 30, benefits: "Oblique strength" },
      { name: "Boat Pose", durationSeconds: 30, benefits: "Core strengthening" },
      { name: "Locust Pose", durationSeconds: 30, benefits: "Back strengthening" },
    ],
    coolDown: [
      { name: "Reclined Bound Angle Pose", durationSeconds: 120, benefits: "Hip and heart opener" },
      { name: "Legs-Up-The-Wall Pose", durationSeconds: 180, benefits: "Calming inversion" },
      { name: "Corpse Pose", durationSeconds: 300, benefits: "Deep relaxation" },
    ],
  },
  advanced: {
    warmUp: [
      { name: "Sun Salutation B", repetitions: 3, benefits: "Intense warm-up" },
      { name: "Dynamic Cat-Cow", durationSeconds: 60, benefits: "Spinal flexibility" },
      { name: "Pigeon Pose Prep", durationSeconds: 60, benefits: "Hip preparation" },
    ],
    standing: [
      { name: "Warrior III", durationSeconds: 30, benefits: "Balance and strength" },
      { name: "Extended Hand to Big Toe", durationSeconds: 30, benefits: "Balance and flexibility" },
      { name: "Revolved Triangle", durationSeconds: 30, benefits: "Twist and balance" },
      { name: "Crow Pose", durationSeconds: 30, benefits: "Arm balance prep" },
    ],
    floor: [
      { name: "King Pigeon Pose", durationSeconds: 60, benefits: "Deep hip opener" },
      { name: "Wheel Pose", durationSeconds: 30, benefits: "Backbend" },
      { name: "Side Crow", durationSeconds: 30, benefits: "Arm balance" },
      { name: "Firefly Pose", durationSeconds: 30, benefits: "Advanced arm balance" },
      { name: "Forearm Stand Prep", durationSeconds: 60, benefits: "Inversion preparation" },
    ],
    coolDown: [
      { name: "Head-to-Knee Forward Bend", durationSeconds: 120, benefits: "Deep forward fold" },
      { name: "Reclined Spinal Twist", durationSeconds: 120, benefits: "Spinal release" },
      { name: "Corpse Pose", durationSeconds: 300, benefits: "Integration" },
    ],
  },
  expert: {
    warmUp: [
      { name: "Full Sun Salutation Flow", repetitions: 5, benefits: "Complete warm-up" },
      { name: "Advanced Cat-Cow Flow", durationSeconds: 60, benefits: "Spinal articulation" },
    ],
    standing: [
      { name: "Dancer Pose", durationSeconds: 30, benefits: "Balance and flexibility" },
      { name: "Handstand", durationSeconds: 30, benefits: "Inversion" },
      { name: "Bird of Paradise", durationSeconds: 30, benefits: "Hip opening and balance" },
    ],
    floor: [
      { name: "Full Splits", durationSeconds: 60, benefits: "Extreme flexibility" },
      { name: "Eight-Angle Pose", durationSeconds: 30, benefits: "Advanced arm balance" },
      { name: "Flying Crow", durationSeconds: 30, benefits: "Advanced arm balance" },
      { name: "Wheel Pose", durationSeconds: 60, benefits: "Deep backbend" },
    ],
    coolDown: [
      { name: "Shoulder Stand", durationSeconds: 120, benefits: "Inversion" },
      { name: "Plow Pose", durationSeconds: 120, benefits: "Deep stretch" },
      { name: "Corpse Pose", durationSeconds: 600, benefits: "Deep integration" },
    ],
  },
};

export const YOGA_GOAL_FOCUS: Partial<Record<GoalType, string>> = {
  flexibility: "Flexibility and Stretching",
  stress_reduction: "Relaxation and Meditation",
  posture: "Posture and Alignment",
  balance: "Balance and Stability",
  core_strength: "Core Strengthening",
  spinal_health: "Spinal Health",
  detoxification: "Detox and Cleansing",
};
