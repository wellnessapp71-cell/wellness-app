/**
 * rPPG scan result post-processing.
 *
 * Validates signal quality, normalizes stress index,
 * and derives actionable stress classifications.
 */

import type { RppgScanResult } from "@aura/types";

// ─── Constants ──────────────────────────────────────────────────

/** Minimum signal quality to accept a scan result */
export const MIN_SIGNAL_QUALITY = 0.5;

/** Heart rate physiological bounds (BPM) */
export const HR_MIN = 40;
export const HR_MAX = 200;

/** Stress level thresholds */
export const STRESS_THRESHOLDS = {
  low: 30,       // 0-29: relaxed
  moderate: 60,  // 30-59: moderate stress
  high: 80,      // 60-79: high stress
  critical: 100, // 80-100: critical
} as const;

export type StressLevel = "low" | "moderate" | "high" | "critical";

// ─── Validation ─────────────────────────────────────────────────

/**
 * Validate a raw rPPG scan result for physiological plausibility.
 */
export function validateScanResult(
  scan: RppgScanResult
): { valid: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (scan.signalQuality < MIN_SIGNAL_QUALITY) {
    reasons.push(
      `Signal quality too low: ${(scan.signalQuality * 100).toFixed(0)}% (need ≥ ${MIN_SIGNAL_QUALITY * 100}%)`
    );
  }

  if (scan.heartRateBpm < HR_MIN || scan.heartRateBpm > HR_MAX) {
    reasons.push(
      `Heart rate ${scan.heartRateBpm} BPM outside physiological range (${HR_MIN}-${HR_MAX})`
    );
  }

  if (scan.stressIndex < 0 || scan.stressIndex > 100) {
    reasons.push(`Stress index ${scan.stressIndex} outside valid range (0-100)`);
  }

  if (scan.scanDurationSeconds < 15) {
    reasons.push(
      `Scan too short: ${scan.scanDurationSeconds}s (need ≥ 15s)`
    );
  }

  return { valid: reasons.length === 0, reasons };
}

// ─── Classification ─────────────────────────────────────────────

/**
 * Classify stress level from stress index (0-100).
 */
export function classifyStressLevel(stressIndex: number): StressLevel {
  if (stressIndex < STRESS_THRESHOLDS.low) return "low";
  if (stressIndex < STRESS_THRESHOLDS.moderate) return "moderate";
  if (stressIndex < STRESS_THRESHOLDS.high) return "high";
  return "critical";
}

/**
 * Get a human-readable stress description.
 */
export function getStressDescription(level: StressLevel): string {
  switch (level) {
    case "low":
      return "Your stress level appears low. You seem relaxed right now.";
    case "moderate":
      return "Your stress level is moderate. Consider a brief calming activity.";
    case "high":
      return "Your stress level appears elevated. Let's start a 3-minute reset.";
    case "critical":
      return "Your stress level is significantly elevated. A calming intervention is strongly recommended.";
  }
}

/**
 * Get the result copy per the PRD wireframe.
 */
export function getResultCopy(stressIndex: number): string {
  const level = classifyStressLevel(stressIndex);
  if (level === "low") {
    return "Your stress level looks good. Keep up the great work!";
  }
  return "Your stress level appears elevated. Let's start a 3-minute reset.";
}

// ─── Wellness Conversion ────────────────────────────────────────

/**
 * Convert stress index to wellness scale (inverted).
 * Stress 0 → Wellness 100, Stress 100 → Wellness 0
 */
export function stressIndexToWellness(stressIndex: number): number {
  return Math.max(0, Math.min(100, 100 - stressIndex));
}

// ─── Heart Rate Analysis ────────────────────────────────────────

/**
 * Classify resting heart rate zone.
 */
export function classifyHeartRateZone(
  bpm: number
): "bradycardia" | "athletic" | "normal" | "elevated" | "tachycardia" {
  if (bpm < 50) return "bradycardia";
  if (bpm < 60) return "athletic";
  if (bpm <= 100) return "normal";
  if (bpm <= 120) return "elevated";
  return "tachycardia";
}

// ─── Scan Comparison ────────────────────────────────────────────

/**
 * Compare two scans to determine improvement (e.g., before/after intervention).
 */
export function compareScanResults(
  before: RppgScanResult,
  after: RppgScanResult
): {
  stressImproved: boolean;
  stressDelta: number;
  hrDelta: number;
  description: string;
} {
  const stressDelta = after.stressIndex - before.stressIndex;
  const hrDelta = after.heartRateBpm - before.heartRateBpm;
  const stressImproved = stressDelta < -5; // at least 5-point drop

  let description: string;
  if (stressImproved) {
    description = `Great progress! Your stress dropped by ${Math.abs(stressDelta)} points after the intervention.`;
  } else if (stressDelta <= 0) {
    description = "Your stress held steady. Even small improvements add up over time.";
  } else {
    description = "No improvement detected this time. Try a different calming technique, or give yourself more time.";
  }

  return { stressImproved, stressDelta, hrDelta, description };
}
