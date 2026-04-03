/**
 * Alert engine — monitors for escalation triggers and generates MentalAlertEvents.
 *
 * Critical triggers:
 * - PHQ-9 item 9 positive (self-harm ideation)
 * - Sustained critical stress (>3 consecutive days above threshold)
 * - Declining trend sustained >2 weeks
 *
 * Warning triggers:
 * - Moderate-severe depression (PHQ-9 ≥ 15)
 * - Moderate+ anxiety (GAD-7 ≥ 10)
 * - Sustained high stress (3+ days at 8+/10)
 */

import type {
  MentalBaseline,
  MentalDailyCheckIn,
  RppgScanResult,
  MentalAlertEvent,
  AlertLevel,
} from "@aura/types";

import { hasPhq9SelfHarmRisk } from "./baseline";
import { classifyStressLevel } from "./rppg-processor";
import { analyzeCheckInTrends } from "./checkin-analyzer";

// ─── Alert Generation ───────────────────────────────────────────

/**
 * Scan all available data for escalation triggers and return alert events.
 */
export function detectAlerts(params: {
  userId: string;
  baseline: MentalBaseline;
  checkIns: MentalDailyCheckIn[];
  scans: RppgScanResult[];
}): MentalAlertEvent[] {
  const { userId, baseline, checkIns, scans } = params;
  const alerts: MentalAlertEvent[] = [];
  const now = new Date().toISOString();

  // ── Critical: Self-harm ideation ──
  if (hasPhq9SelfHarmRisk(baseline.phq9Answers)) {
    alerts.push({
      alertId: generateAlertId(),
      userId,
      level: "critical",
      reason:
        "PHQ-9 item 9 indicates possible self-harm ideation. Immediate support recommended.",
      createdAtIso: now,
    });
  }

  // ── Critical: Combined severe depression + severe anxiety ──
  if (baseline.phq9Score >= 20 && baseline.gad7Score >= 15) {
    alerts.push({
      alertId: generateAlertId(),
      userId,
      level: "critical",
      reason:
        "Severe depression (PHQ-9 ≥ 20) combined with severe anxiety (GAD-7 ≥ 15). Professional support strongly recommended.",
      createdAtIso: now,
    });
  }

  // ── Warning: Moderately severe depression ──
  if (baseline.phq9Score >= 15 && baseline.phq9Score < 20) {
    alerts.push({
      alertId: generateAlertId(),
      userId,
      level: "warning",
      reason: `PHQ-9 score of ${baseline.phq9Score} indicates moderately severe depression. Consider counselor booking.`,
      createdAtIso: now,
    });
  }

  // ── Warning: Moderate+ anxiety ──
  if (baseline.gad7Score >= 10) {
    alerts.push({
      alertId: generateAlertId(),
      userId,
      level: "warning",
      reason: `GAD-7 score of ${baseline.gad7Score} indicates moderate or higher anxiety.`,
      createdAtIso: now,
    });
  }

  // ── Warning/Critical: Sustained high stress from check-ins ──
  const recent7 = checkIns.slice(-7);
  const highStressDays = recent7.filter((c) => c.stressScoreManual >= 8);

  if (highStressDays.length >= 5) {
    alerts.push({
      alertId: generateAlertId(),
      userId,
      level: "critical",
      reason: `Stress has been at 8+ for ${highStressDays.length} of the last 7 days. Immediate intervention recommended.`,
      createdAtIso: now,
    });
  } else if (highStressDays.length >= 3) {
    alerts.push({
      alertId: generateAlertId(),
      userId,
      level: "warning",
      reason: `Stress has been at 8+ for ${highStressDays.length} of the last 7 days. Calming interventions recommended.`,
      createdAtIso: now,
    });
  }

  // ── Warning: rPPG shows critical stress ──
  const latestScan = scans[scans.length - 1];
  if (latestScan && classifyStressLevel(latestScan.stressIndex) === "critical") {
    alerts.push({
      alertId: generateAlertId(),
      userId,
      level: "warning",
      reason: `Latest rPPG scan shows critical stress (index: ${latestScan.stressIndex}). Immediate calming activity recommended.`,
      createdAtIso: now,
    });
  }

  // ── Warning: Declining mood trend over 2 weeks ──
  if (checkIns.length >= 10) {
    const trendAnalysis = analyzeCheckInTrends(userId, checkIns, 14);
    const moodField = trendAnalysis.fields.find((f) => f.field === "Mood");
    if (moodField && moodField.direction === "declining" && moodField.changePercent < -15) {
      alerts.push({
        alertId: generateAlertId(),
        userId,
        level: "warning",
        reason: `Mood has been declining over the past 2 weeks (${moodField.changePercent}% change). Plan adjustment recommended.`,
        createdAtIso: now,
      });
    }
  }

  // ── Info: Support requested in recent check-in ──
  const supportRequested = recent7.some((c) => c.supportRequested);
  if (supportRequested) {
    alerts.push({
      alertId: generateAlertId(),
      userId,
      level: "info",
      reason: "User has requested support in a recent check-in.",
      createdAtIso: now,
    });
  }

  return alerts;
}

/**
 * Get the highest alert level from a list of alerts.
 */
export function getHighestAlertLevel(alerts: MentalAlertEvent[]): AlertLevel {
  if (alerts.some((a) => a.level === "critical")) return "critical";
  if (alerts.some((a) => a.level === "warning")) return "warning";
  return "info";
}

/**
 * Filter alerts that haven't been resolved.
 */
export function getUnresolvedAlerts(
  alerts: MentalAlertEvent[]
): MentalAlertEvent[] {
  return alerts.filter((a) => !a.resolvedBy);
}

// ─── Helpers ────────────────────────────────────────────────────

function generateAlertId(): string {
  return (
    "alert_" +
    Math.random().toString(36).slice(2, 11) +
    Date.now().toString(36)
  );
}
