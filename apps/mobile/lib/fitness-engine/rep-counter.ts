/**
 * Real-time rep counter with 4-state machine, bilateral angle tracking,
 * EMA smoothing, per-rep quality scoring, and form feedback.
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

/** Landmarks keyed by MediaPipe-compatible name */
export type PoseLandmarks = Record<string, Landmark>;

// ── Rep Quality ──

export interface RepQuality {
  /** 0–1: how much of the ideal ROM (range of motion) was achieved */
  depthScore: number;
  /** Duration of the full rep cycle in ms */
  tempoMs: number;
  /** Confidence score when rep was counted */
  confidence: number;
}

// ── Rep Counter State ──

export type RepPhase = "standing" | "descending" | "bottom" | "ascending";

export type FormFeedback =
  | "good_form"
  | "go_deeper"
  | "go_higher"
  | "partial_rep"
  | null;

export interface RepCounterState {
  reps: number;
  phase: RepPhase;
  emaAngle: number | null;
  currentAngle: number | null;
  repConfidence: number;
  lastRepTimestamp: number;
  temporalBuffer: number[];
  angleHistory: number[];
  stateDurations: Record<RepPhase, number>;
  stateEntryTime: number;
  formFeedback: FormFeedback;
  active: boolean;
  /** Quality history for each counted rep */
  repHistory: RepQuality[];
  /** Highest angle observed in current rep cycle */
  peakAngle: number;
  /** Lowest angle observed in current rep cycle */
  troughAngle: number;
  /** When descent started (for tempo scoring) */
  repStartTime: number;
}

// ── Constants ──

const EMA_ALPHA = 0.7;
const MIN_TIME_BETWEEN_REPS_MS = 1000;
const TEMPORAL_BUFFER_SIZE = 5;
const MAX_ANGLE_HISTORY = 5;

// ── Public API ──

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
    repHistory: [],
    peakAngle: 0,
    troughAngle: 180,
    repStartTime: 0,
  };
}

export function startCounting(state: RepCounterState): RepCounterState {
  return { ...state, active: true, stateEntryTime: Date.now() };
}

export function stopCounting(state: RepCounterState): RepCounterState {
  return { ...state, active: false };
}

export function resetCounter(): RepCounterState {
  return createRepCounter();
}

/**
 * Calculate angle (degrees) between three landmarks. Vertex = middle point (b).
 */
export function calculateAngle(
  a: Landmark,
  b: Landmark,
  c: Landmark,
): number {
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
 * Extract angle from a single body side (the configured landmarks).
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
 * Extract angle using BOTH body sides (LEFT + RIGHT) and average them.
 * Falls back to whichever side is visible. More robust than single-side
 * tracking — handles partial occlusion and camera angles gracefully.
 */
export function extractBilateralAngle(
  landmarks: PoseLandmarks,
  config: AccuracyAngle,
  minVisibility: number = 0.3,
): number | null {
  const leftAngle = extractAngle(landmarks, config, minVisibility);

  // Build the mirrored config: LEFT_ ↔ RIGHT_
  const mirroredNames = config.angle.map((name) =>
    name.startsWith("LEFT_")
      ? name.replace("LEFT_", "RIGHT_")
      : name.startsWith("RIGHT_")
        ? name.replace("RIGHT_", "LEFT_")
        : name,
  ) as [string, string, string];
  const mirroredConfig: AccuracyAngle = {
    angle: mirroredNames,
    min: config.min,
    max: config.max,
  };
  const rightAngle = extractAngle(landmarks, mirroredConfig, minVisibility);

  if (leftAngle !== null && rightAngle !== null) {
    return (leftAngle + rightAngle) / 2;
  }
  return leftAngle ?? rightAngle;
}

/**
 * Process a new frame of pose data.
 *
 * 4-state machine: standing → descending → bottom → ascending → rep → standing
 * With bilateral angle tracking, EMA smoothing, and per-rep quality scoring.
 */
export function processFrame(
  state: RepCounterState,
  landmarks: PoseLandmarks,
  config: AccuracyAngle,
  targetReps: number,
): RepCounterState {
  if (!state.active) return state;

  const rawAngle = extractBilateralAngle(landmarks, config, 0.3);
  if (rawAngle === null) return state;

  const now = Date.now();

  // ── Temporal buffer (median filter) ──
  const temporalBuffer = [...state.temporalBuffer, rawAngle];
  if (temporalBuffer.length > TEMPORAL_BUFFER_SIZE) temporalBuffer.shift();
  const smoothedAngle =
    temporalBuffer.length >= 3 ? median(temporalBuffer) : rawAngle;

  // ── Angle history ──
  const angleHistory = [...state.angleHistory, smoothedAngle];
  if (angleHistory.length > MAX_ANGLE_HISTORY) angleHistory.shift();
  const filteredAngle =
    angleHistory.length >= 3 ? median(angleHistory) : smoothedAngle;

  // ── EMA smoothing ──
  const emaAngle =
    state.emaAngle === null
      ? filteredAngle
      : EMA_ALPHA * filteredAngle + (1 - EMA_ALPHA) * state.emaAngle;

  // ── Thresholds ──
  const lowI = config.min;
  const highI = config.max;
  const depthLow = Math.max(0, lowI - 15);
  const depthHigh = Math.min(180, highI + 15);

  // ── Phase durations ──
  const elapsed = now - state.stateEntryTime;
  const stateDurations = { ...state.stateDurations };
  stateDurations[state.phase] += elapsed;

  // ── Track peak / trough for quality scoring ──
  let peakAngle = state.peakAngle;
  let troughAngle = state.troughAngle;
  let repStartTime = state.repStartTime;

  // ── State machine ──
  let phase = state.phase;
  let reps = state.reps;
  let repConfidence = state.repConfidence;
  let lastRepTimestamp = state.lastRepTimestamp;
  let stateEntryTime = state.stateEntryTime;
  let repHistory = state.repHistory;

  function resetDurations() {
    stateDurations.standing = 0;
    stateDurations.descending = 0;
    stateDurations.bottom = 0;
    stateDurations.ascending = 0;
  }

  if (phase === "standing") {
    peakAngle = Math.max(peakAngle, emaAngle);

    if (emaAngle <= highI - 20 && stateDurations.standing >= 200) {
      phase = "descending";
      stateEntryTime = now;
      repStartTime = now;
      troughAngle = emaAngle;
      resetDurations();
      repConfidence = Math.min(1, repConfidence + 0.15);
    }
  } else if (phase === "descending") {
    troughAngle = Math.min(troughAngle, emaAngle);

    if (emaAngle <= lowI + 30) {
      repConfidence = Math.min(1, repConfidence + 0.1);
    }
    if (emaAngle <= lowI + 15 && stateDurations.descending >= 150) {
      phase = "bottom";
      stateEntryTime = now;
      resetDurations();
    } else if (emaAngle >= highI - 10) {
      // Aborted — went back up without reaching bottom
      repConfidence = Math.max(0, repConfidence - 0.15);
      phase = "standing";
      stateEntryTime = now;
      peakAngle = emaAngle;
      troughAngle = 180;
      resetDurations();
    }
  } else if (phase === "bottom") {
    troughAngle = Math.min(troughAngle, emaAngle);

    if (emaAngle <= lowI + 20 && stateDurations.bottom >= 80) {
      repConfidence = Math.min(1, repConfidence + 0.1);
    }
    if (emaAngle >= lowI + 20 && stateDurations.bottom >= 100) {
      phase = "ascending";
      stateEntryTime = now;
      resetDurations();
    }
  } else if (phase === "ascending") {
    if (emaAngle >= highI - 30) {
      repConfidence = Math.min(1, repConfidence + 0.1);
    }
    if (emaAngle >= highI - 10 && stateDurations.ascending >= 150) {
      if (
        repConfidence >= 0.4 &&
        now - lastRepTimestamp >= MIN_TIME_BETWEEN_REPS_MS
      ) {
        // ── Score this rep ──
        const range = highI - lowI;
        const romAchieved = peakAngle - troughAngle;
        const depthScore = Math.min(1, romAchieved / (range * 0.85));
        const tempoMs = now - repStartTime;
        const quality: RepQuality = {
          depthScore: Math.round(depthScore * 100) / 100,
          tempoMs,
          confidence: Math.round(repConfidence * 100) / 100,
        };

        reps += 1;
        repHistory = [...repHistory, quality];
        lastRepTimestamp = now;
        phase = "standing";
        repConfidence = 0;
        stateEntryTime = now;
        peakAngle = emaAngle;
        troughAngle = 180;
        resetDurations();
      }
    } else if (emaAngle < lowI + 20) {
      // Going back down during ascending — partial rep
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
    repHistory,
    peakAngle,
    troughAngle,
    repStartTime,
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
