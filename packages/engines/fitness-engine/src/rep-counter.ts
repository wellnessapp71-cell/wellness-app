/**
 * Real-time rep counter with 4-state machine, EMA smoothing, and form feedback.
 * Ported from GYM 3/GYM/src/realtime_guidance.py → perform_set() state machine.
 *
 * Pure logic — no camera, UI, or native dependencies.
 * Feed it landmark coordinates from any pose detector.
 */

import type { AccuracyAngle } from "./angle-config";

// ── Pose Landmark Types ──

export interface Landmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

/** 33 landmarks keyed by MediaPipe/ML Kit name */
export type PoseLandmarks = Record<string, Landmark>;

// ── Rep Counter State ──

export type RepPhase = "standing" | "descending" | "bottom" | "ascending";

export type FormFeedback = "good_form" | "go_deeper" | "go_higher" | "partial_rep" | null;

export interface RepCounterState {
  /** Current rep count */
  reps: number;
  /** Current phase in the 4-state machine */
  phase: RepPhase;
  /** EMA-smoothed angle */
  emaAngle: number | null;
  /** Raw current angle (for display) */
  currentAngle: number | null;
  /** Confidence that current motion is a valid rep [0..1] */
  repConfidence: number;
  /** Timestamp of last counted rep (ms) */
  lastRepTimestamp: number;
  /** Temporal buffer for noise reduction */
  temporalBuffer: number[];
  /** Angle history for additional filtering */
  angleHistory: number[];
  /** Duration tracking per phase (ms) */
  stateDurations: Record<RepPhase, number>;
  /** When current phase started (ms) */
  stateEntryTime: number;
  /** Form feedback for UI overlay */
  formFeedback: FormFeedback;
  /** Whether counting is active */
  active: boolean;
}

// ── Constants (from GYM 3) ──

const EMA_ALPHA = 0.7;
const MIN_TIME_BETWEEN_REPS_MS = 1000;
const TEMPORAL_BUFFER_SIZE = 5;
const MAX_ANGLE_HISTORY = 5;

// ── Public API ──

/** Create a fresh counter state */
export function createRepCounter(): RepCounterState {
  return {
    reps: 0,
    phase: "standing",
    emaAngle: null,
    currentAngle: null,
    repConfidence: 0,
    lastRepTimestamp: 0,
    temporalBuffer: [],
    angleHistory: [],
    stateDurations: { standing: 0, descending: 0, bottom: 0, ascending: 0 },
    stateEntryTime: Date.now(),
    formFeedback: null,
    active: false,
  };
}

/** Start counting reps */
export function startCounting(state: RepCounterState): RepCounterState {
  return { ...state, active: true, stateEntryTime: Date.now() };
}

/** Stop counting reps */
export function stopCounting(state: RepCounterState): RepCounterState {
  return { ...state, active: false };
}

/** Reset counter to zero */
export function resetCounter(): RepCounterState {
  return createRepCounter();
}

/**
 * Calculate the angle (in degrees) between three landmark points.
 * Vertex is the middle point (b). Ported from GYM 3 _calculate_angle().
 */
export function calculateAngle(a: Landmark, b: Landmark, c: Landmark): number {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };

  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAB = Math.hypot(ab.x, ab.y);
  const magCB = Math.hypot(cb.x, cb.y);

  if (magAB === 0 || magCB === 0) return 0;

  const cosAngle = Math.max(-1, Math.min(1, dot / (magAB * magCB)));
  return (Math.acos(cosAngle) * 180) / Math.PI;
}

/**
 * Extract the tracked angle from pose landmarks using the accuracy angle config.
 * Returns null if any required landmark is missing or has low visibility.
 */
export function extractAngle(
  landmarks: PoseLandmarks,
  config: AccuracyAngle,
  minVisibility: number = 0.5,
): number | null {
  const [nameA, nameB, nameC] = config.angle;
  const a = landmarks[nameA];
  const b = landmarks[nameB];
  const c = landmarks[nameC];

  if (!a || !b || !c) return null;

  // Check visibility if available
  if (
    (a.visibility !== undefined && a.visibility < minVisibility) ||
    (b.visibility !== undefined && b.visibility < minVisibility) ||
    (c.visibility !== undefined && c.visibility < minVisibility)
  ) {
    return null;
  }

  return calculateAngle(a, b, c);
}

/**
 * Process a new frame of pose data.
 * Call this on every frame where landmarks are detected (~10-30fps).
 *
 * Implements the GYM 3 4-state machine:
 *   standing → descending → bottom → ascending → rep counted → standing
 *
 * With EMA smoothing, temporal buffering, hysteresis thresholds, and confidence scoring.
 */
export function processFrame(
  state: RepCounterState,
  landmarks: PoseLandmarks,
  config: AccuracyAngle,
  targetReps: number,
): RepCounterState {
  if (!state.active) return state;

  const rawAngle = extractAngle(landmarks, config);
  if (rawAngle === null) return state;

  const now = Date.now();

  // ── Temporal buffer (median filter for noise reduction) ──
  const temporalBuffer = [...state.temporalBuffer, rawAngle];
  if (temporalBuffer.length > TEMPORAL_BUFFER_SIZE) temporalBuffer.shift();

  const smoothedAngle =
    temporalBuffer.length >= 3
      ? median(temporalBuffer)
      : rawAngle;

  // ── Angle history (additional noise filtering) ──
  const angleHistory = [...state.angleHistory, smoothedAngle];
  if (angleHistory.length > MAX_ANGLE_HISTORY) angleHistory.shift();

  const filteredAngle =
    angleHistory.length >= 3
      ? median(angleHistory)
      : smoothedAngle;

  // ── EMA smoothing ──
  const emaAngle =
    state.emaAngle === null
      ? filteredAngle
      : EMA_ALPHA * filteredAngle + (1 - EMA_ALPHA) * state.emaAngle;

  // ── Hysteresis thresholds ──
  const lowI = config.min;
  const highI = config.max;
  const depthLow = Math.max(0, lowI - 15);
  const depthHigh = Math.min(180, highI + 15);

  // ── Update phase durations ──
  const elapsed = now - state.stateEntryTime;
  const stateDurations = { ...state.stateDurations };
  stateDurations[state.phase] += elapsed;

  // ── 4-state machine (from GYM 3) ──
  let phase = state.phase;
  let reps = state.reps;
  let repConfidence = state.repConfidence;
  let lastRepTimestamp = state.lastRepTimestamp;
  let stateEntryTime = state.stateEntryTime;

  function resetDurations() {
    stateDurations.standing = 0;
    stateDurations.descending = 0;
    stateDurations.bottom = 0;
    stateDurations.ascending = 0;
  }

  if (phase === "standing") {
    if (emaAngle <= lowI && stateDurations.standing >= 300) {
      phase = "descending";
      stateEntryTime = now;
      resetDurations();
      repConfidence = Math.min(1, repConfidence + 0.2);
    }
  } else if (phase === "descending") {
    if (emaAngle <= lowI - 5) {
      repConfidence = Math.min(1, repConfidence + 0.1);
    }
    if (emaAngle <= lowI - 10 && stateDurations.descending >= 200) {
      phase = "bottom";
      stateEntryTime = now;
      resetDurations();
    } else if (emaAngle > lowI + 10) {
      repConfidence = Math.max(0, repConfidence - 0.15);
    }
  } else if (phase === "bottom") {
    if (emaAngle <= lowI + 5 && stateDurations.bottom >= 100) {
      repConfidence = Math.min(1, repConfidence + 0.1);
    }
    if (emaAngle >= lowI + 15 && stateDurations.bottom >= 150) {
      phase = "ascending";
      stateEntryTime = now;
      resetDurations();
    }
  } else if (phase === "ascending") {
    if (emaAngle >= lowI + 20) {
      repConfidence = Math.min(1, repConfidence + 0.1);
    }
    if (emaAngle >= highI && stateDurations.ascending >= 200) {
      if (repConfidence >= 0.6 && now - lastRepTimestamp >= MIN_TIME_BETWEEN_REPS_MS) {
        reps += 1;
        lastRepTimestamp = now;
        phase = "standing";
        repConfidence = 0;
        stateEntryTime = now;
        resetDurations();
      }
    } else if (emaAngle < highI - 20) {
      repConfidence = Math.max(0, repConfidence - 0.2);
    }
  }

  // ── Form feedback ──
  let formFeedback: FormFeedback = null;
  if (state.active) {
    if (emaAngle < depthLow) {
      formFeedback = "go_higher";
    } else if (emaAngle > depthHigh) {
      formFeedback = "go_deeper";
    } else if (phase === "ascending" && repConfidence < 0.4) {
      formFeedback = "partial_rep";
    } else if (phase !== "standing") {
      formFeedback = "good_form";
    }
  }

  // Auto-stop when target reached
  const active = reps >= targetReps ? false : state.active;

  return {
    reps,
    phase,
    emaAngle,
    currentAngle: rawAngle,
    repConfidence,
    lastRepTimestamp,
    temporalBuffer,
    angleHistory,
    stateDurations,
    stateEntryTime,
    formFeedback,
    active,
  };
}

// ── Helpers ──

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}
