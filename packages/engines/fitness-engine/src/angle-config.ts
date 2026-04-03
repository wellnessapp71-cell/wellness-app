/**
 * Exercise angle configurations for pose-based rep counting.
 * Ported from GYM 3/GYM/src/realtime_guidance.py → _get_angle_config()
 *
 * Each exercise maps to:
 *  - trackedAngles: landmark triplets to monitor
 *  - accuracyAngle: primary angle used for rep counting + ideal range
 *
 * Landmark names follow MediaPipe / ML Kit PoseLandmark enum.
 */

export interface AngleSpec {
  /** Three landmark names forming the angle (vertex is the middle one) */
  points: [string, string, string];
  /** Ideal range [min, max] in degrees */
  idealRange: [number, number];
}

export interface AccuracyAngle {
  /** Three landmark names forming the angle */
  angle: [string, string, string];
  /** Minimum angle for bottom of rep */
  min: number;
  /** Maximum angle for top of rep */
  max: number;
}

export interface AngleConfig {
  trackedAngles: AngleSpec[];
  accuracyAngle: AccuracyAngle;
}

// ── Exercise Presets (from GYM 3) ──

const PRESETS: Record<string, AngleConfig> = {
  "push-ups": {
    trackedAngles: [
      { points: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"], idealRange: [70, 170] },
      { points: ["RIGHT_SHOULDER", "RIGHT_ELBOW", "RIGHT_WRIST"], idealRange: [70, 170] },
    ],
    accuracyAngle: { angle: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"], min: 70, max: 170 },
  },
  "incline push-ups": {
    trackedAngles: [{ points: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"], idealRange: [70, 170] }],
    accuracyAngle: { angle: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"], min: 70, max: 170 },
  },
  "decline push-ups": {
    trackedAngles: [{ points: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"], idealRange: [70, 170] }],
    accuracyAngle: { angle: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"], min: 70, max: 170 },
  },
  squats: {
    trackedAngles: [
      { points: ["LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"], idealRange: [70, 170] },
      { points: ["RIGHT_HIP", "RIGHT_KNEE", "RIGHT_ANKLE"], idealRange: [70, 170] },
    ],
    accuracyAngle: { angle: ["LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"], min: 70, max: 170 },
  },
  lunges: {
    trackedAngles: [{ points: ["LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"], idealRange: [70, 170] }],
    accuracyAngle: { angle: ["LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"], min: 70, max: 170 },
  },
  "bicep curls": {
    trackedAngles: [{ points: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"], idealRange: [40, 160] }],
    accuracyAngle: { angle: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"], min: 40, max: 160 },
  },
  "shoulder press": {
    trackedAngles: [{ points: ["LEFT_ELBOW", "LEFT_SHOULDER", "LEFT_HIP"], idealRange: [50, 120] }],
    accuracyAngle: { angle: ["LEFT_ELBOW", "LEFT_SHOULDER", "LEFT_HIP"], min: 50, max: 120 },
  },
  "pull-ups": {
    trackedAngles: [{ points: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"], idealRange: [60, 160] }],
    accuracyAngle: { angle: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"], min: 60, max: 160 },
  },
  "tricep dips": {
    trackedAngles: [{ points: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"], idealRange: [60, 160] }],
    accuracyAngle: { angle: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"], min: 60, max: 160 },
  },
  deadlifts: {
    trackedAngles: [{ points: ["LEFT_SHOULDER", "LEFT_HIP", "LEFT_KNEE"], idealRange: [150, 180] }],
    accuracyAngle: { angle: ["LEFT_SHOULDER", "LEFT_HIP", "LEFT_KNEE"], min: 150, max: 180 },
  },
  plank: {
    trackedAngles: [{ points: ["LEFT_SHOULDER", "LEFT_HIP", "LEFT_ANKLE"], idealRange: [150, 180] }],
    accuracyAngle: { angle: ["LEFT_SHOULDER", "LEFT_HIP", "LEFT_ANKLE"], min: 150, max: 180 },
  },
  "bench press": {
    trackedAngles: [{ points: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"], idealRange: [60, 160] }],
    accuracyAngle: { angle: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"], min: 60, max: 160 },
  },
  "dumbbell press": {
    trackedAngles: [{ points: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"], idealRange: [60, 160] }],
    accuracyAngle: { angle: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"], min: 60, max: 160 },
  },
  "dumbbell flyes": {
    trackedAngles: [{ points: ["LEFT_ELBOW", "LEFT_SHOULDER", "LEFT_HIP"], idealRange: [60, 140] }],
    accuracyAngle: { angle: ["LEFT_ELBOW", "LEFT_SHOULDER", "LEFT_HIP"], min: 60, max: 140 },
  },
  "cable flyes": {
    trackedAngles: [{ points: ["LEFT_ELBOW", "LEFT_SHOULDER", "LEFT_HIP"], idealRange: [60, 140] }],
    accuracyAngle: { angle: ["LEFT_ELBOW", "LEFT_SHOULDER", "LEFT_HIP"], min: 60, max: 140 },
  },
  "reverse flyes": {
    trackedAngles: [{ points: ["LEFT_ELBOW", "LEFT_SHOULDER", "LEFT_HIP"], idealRange: [60, 140] }],
    accuracyAngle: { angle: ["LEFT_ELBOW", "LEFT_SHOULDER", "LEFT_HIP"], min: 60, max: 140 },
  },
  "lat pulldowns": {
    trackedAngles: [{ points: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"], idealRange: [60, 150] }],
    accuracyAngle: { angle: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"], min: 60, max: 150 },
  },
  "seated rows": {
    trackedAngles: [{ points: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"], idealRange: [60, 150] }],
    accuracyAngle: { angle: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"], min: 60, max: 150 },
  },
  "bent-over rows": {
    trackedAngles: [{ points: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"], idealRange: [60, 150] }],
    accuracyAngle: { angle: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"], min: 60, max: 150 },
  },
  "calf raises": {
    trackedAngles: [{ points: ["LEFT_KNEE", "LEFT_ANKLE", "LEFT_FOOT_INDEX"], idealRange: [80, 120] }],
    accuracyAngle: { angle: ["LEFT_KNEE", "LEFT_ANKLE", "LEFT_FOOT_INDEX"], min: 80, max: 120 },
  },
  "wall sits": {
    trackedAngles: [{ points: ["LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"], idealRange: [80, 100] }],
    accuracyAngle: { angle: ["LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"], min: 80, max: 100 },
  },
  "step-ups": {
    trackedAngles: [{ points: ["LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"], idealRange: [70, 170] }],
    accuracyAngle: { angle: ["LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"], min: 70, max: 170 },
  },
  "leg press": {
    trackedAngles: [{ points: ["LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"], idealRange: [70, 150] }],
    accuracyAngle: { angle: ["LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"], min: 70, max: 150 },
  },
  "bulgarian split squats": {
    trackedAngles: [{ points: ["LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"], idealRange: [70, 170] }],
    accuracyAngle: { angle: ["LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"], min: 70, max: 170 },
  },
  "hammer curls": {
    trackedAngles: [{ points: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"], idealRange: [40, 160] }],
    accuracyAngle: { angle: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"], min: 40, max: 160 },
  },
  "overhead tricep extension": {
    trackedAngles: [{ points: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"], idealRange: [40, 160] }],
    accuracyAngle: { angle: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"], min: 40, max: 160 },
  },
  "resistance band curls": {
    trackedAngles: [{ points: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"], idealRange: [40, 160] }],
    accuracyAngle: { angle: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"], min: 40, max: 160 },
  },
  "cable tricep pushdowns": {
    trackedAngles: [{ points: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"], idealRange: [60, 160] }],
    accuracyAngle: { angle: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"], min: 60, max: 160 },
  },
  "mountain climbers": {
    trackedAngles: [{ points: ["LEFT_SHOULDER", "LEFT_HIP", "LEFT_KNEE"], idealRange: [60, 160] }],
    accuracyAngle: { angle: ["LEFT_SHOULDER", "LEFT_HIP", "LEFT_KNEE"], min: 60, max: 160 },
  },
  "russian twists": {
    trackedAngles: [{ points: ["LEFT_SHOULDER", "LEFT_HIP", "LEFT_KNEE"], idealRange: [60, 160] }],
    accuracyAngle: { angle: ["LEFT_SHOULDER", "LEFT_HIP", "LEFT_KNEE"], min: 60, max: 160 },
  },
  "dead bug": {
    trackedAngles: [{ points: ["LEFT_SHOULDER", "LEFT_HIP", "LEFT_KNEE"], idealRange: [80, 170] }],
    accuracyAngle: { angle: ["LEFT_SHOULDER", "LEFT_HIP", "LEFT_KNEE"], min: 80, max: 170 },
  },
  "hanging leg raises": {
    trackedAngles: [{ points: ["LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"], idealRange: [40, 160] }],
    accuracyAngle: { angle: ["LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"], min: 40, max: 160 },
  },
  "cable woodchops": {
    trackedAngles: [{ points: ["LEFT_SHOULDER", "LEFT_HIP", "LEFT_KNEE"], idealRange: [60, 160] }],
    accuracyAngle: { angle: ["LEFT_SHOULDER", "LEFT_HIP", "LEFT_KNEE"], min: 60, max: 160 },
  },
  "jumping jacks": {
    trackedAngles: [{ points: ["LEFT_ELBOW", "LEFT_SHOULDER", "LEFT_HIP"], idealRange: [60, 140] }],
    accuracyAngle: { angle: ["LEFT_ELBOW", "LEFT_SHOULDER", "LEFT_HIP"], min: 60, max: 140 },
  },
  burpees: {
    trackedAngles: [{ points: ["LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"], idealRange: [60, 170] }],
    accuracyAngle: { angle: ["LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"], min: 60, max: 170 },
  },
  crunches: {
    trackedAngles: [{ points: ["LEFT_SHOULDER", "LEFT_HIP", "LEFT_KNEE"], idealRange: [60, 140] }],
    accuracyAngle: { angle: ["LEFT_SHOULDER", "LEFT_HIP", "LEFT_KNEE"], min: 60, max: 140 },
  },
};

/**
 * Resolve angle configuration for an exercise.
 * Matches by exact name, then keyword fallback, then body-part fallback.
 * Mirrors GYM 3 _get_angle_config().
 */
export function getAngleConfig(
  exerciseName: string,
  bodyParts?: string[],
): AngleConfig {
  const key = exerciseName.trim().toLowerCase();

  // Exact match
  if (PRESETS[key]) return PRESETS[key];

  // Keyword fallback — upper body push/pull
  const upperKeywords = ["push-up", "push-ups", "push ups", "press", "row", "fly", "flye", "curl"];
  if (upperKeywords.some((k) => key.includes(k))) {
    return {
      trackedAngles: [{ points: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"], idealRange: [60, 160] }],
      accuracyAngle: { angle: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"], min: 60, max: 160 },
    };
  }

  // Keyword fallback — lower body
  const lowerKeywords = ["squat", "lunge", "step", "calf", "leg"];
  if (lowerKeywords.some((k) => key.includes(k))) {
    return {
      trackedAngles: [{ points: ["LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"], idealRange: [70, 170] }],
      accuracyAngle: { angle: ["LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"], min: 70, max: 170 },
    };
  }

  // Keyword fallback — core/plank
  const coreKeywords = ["plank", "crunch", "twist", "bug", "mountain", "raise", "woodchop", "jack"];
  if (coreKeywords.some((k) => key.includes(k))) {
    return {
      trackedAngles: [{ points: ["LEFT_SHOULDER", "LEFT_HIP", "LEFT_KNEE"], idealRange: [60, 160] }],
      accuracyAngle: { angle: ["LEFT_SHOULDER", "LEFT_HIP", "LEFT_KNEE"], min: 60, max: 160 },
    };
  }

  // Body-part fallback
  const parts = bodyParts ?? [];
  if (parts.some((p) => p.includes("legs") || p.includes("core"))) {
    return {
      trackedAngles: [{ points: ["LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"], idealRange: [70, 170] }],
      accuracyAngle: { angle: ["LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"], min: 70, max: 170 },
    };
  }

  // Default: upper-body fallback
  return {
    trackedAngles: [{ points: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"], idealRange: [60, 160] }],
    accuracyAngle: { angle: ["LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"], min: 60, max: 160 },
  };
}
