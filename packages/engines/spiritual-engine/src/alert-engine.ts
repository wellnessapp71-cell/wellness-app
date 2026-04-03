/**
 * Alert / escalation detection engine for spiritual wellness.
 *
 * Monitors for escalation triggers:
 * - Very low calm scores sustained over multiple days
 * - Complete disengagement from practices
 * - Declining trend sustained over 2+ weeks
 * - User-expressed distress or inability to cope
 *
 * Safety rule: Any severe distress / hopelessness signal → force red band.
 */

import type {
  SpiritualBaseline,
  SpiritualDailyCheckIn,
  SpiritualAlert,
} from "@aura/types";

import { analyzeSpiritualCheckIns } from "./checkin-analyzer";

// ─── Alert Generation ───────────────────────────────────────────

/**
 * Scan all available data for escalation triggers and return alert events.
 */
export function detectAlerts(params: {
  baseline: SpiritualBaseline;
  checkIns: SpiritualDailyCheckIn[];
}): SpiritualAlert[] {
  const { baseline, checkIns } = params;
  const alerts: SpiritualAlert[] = [];
  const now = new Date().toISOString();

  // ── Critical: Very low composite score ──
  if (baseline.totalScore < 20) {
    alerts.push({
      alertId: generateAlertId(),
      level: "critical",
      reason:
        "Inner calm score is critically low. Immediate support and simplified plan recommended.",
      createdAt: now,
    });
  }

  // ── Critical: All domain scores below 30 ──
  if (
    baseline.meaningScore < 30 &&
    baseline.peaceScore < 30 &&
    baseline.mindfulnessScore < 30 &&
    baseline.connectionScore < 30
  ) {
    alerts.push({
      alertId: generateAlertId(),
      level: "critical",
      reason:
        "All domain scores are very low. Deep support pathway recommended.",
      createdAt: now,
    });
  }

  // ── Warning: Low baseline ──
  if (baseline.totalScore >= 20 && baseline.totalScore < 40) {
    alerts.push({
      alertId: generateAlertId(),
      level: "warning",
      reason: `Inner calm score of ${baseline.totalScore}/100 indicates significant challenges. Enhanced support recommended.`,
      createdAt: now,
    });
  }

  // ── Warning/Critical: Sustained low calm from check-ins ──
  const recent7 = checkIns.slice(-7);
  const veryLowCalmDays = recent7.filter((c) => c.calmScore <= 2).length;
  const lowCalmDays = recent7.filter((c) => c.calmScore <= 4).length;

  if (veryLowCalmDays >= 5) {
    alerts.push({
      alertId: generateAlertId(),
      level: "critical",
      reason: `Calm has been at 2 or below for ${veryLowCalmDays} of the last 7 days. Immediate professional support recommended.`,
      createdAt: now,
    });
  } else if (veryLowCalmDays >= 3) {
    alerts.push({
      alertId: generateAlertId(),
      level: "warning",
      reason: `Calm has been at 2 or below for ${veryLowCalmDays} of the last 7 days. Intensified support recommended.`,
      createdAt: now,
    });
  }

  // ── Warning: Complete disengagement ──
  if (recent7.length >= 5) {
    const noPractice = recent7.filter((c) => !c.didPractice).length;
    const noConnection = recent7.filter((c) => c.feltConnected === "no").length;

    if (noPractice >= 5 && noConnection >= 5) {
      alerts.push({
        alertId: generateAlertId(),
        level: "warning",
        reason:
          "No practice or connection for 5+ days. Engagement recovery plan recommended.",
        createdAt: now,
      });
    }
  }

  // ── Warning: Declining 14-day trend ──
  if (checkIns.length >= 10) {
    const trend = analyzeSpiritualCheckIns(checkIns, 14);
    if (trend.overallDirection === "declining") {
      alerts.push({
        alertId: generateAlertId(),
        level: "warning",
        reason:
          "Calm trend has been declining over the past 2 weeks. Plan adjustment recommended.",
        createdAt: now,
      });
    }
  }

  // ── Info: Multiple blockers reported ──
  if (recent7.length > 0) {
    const totalBlockers = recent7.reduce(
      (sum, c) => sum + c.blockers.length,
      0
    );
    if (totalBlockers >= 10) {
      alerts.push({
        alertId: generateAlertId(),
        level: "info",
        reason:
          "Multiple blockers reported this week. Consider addressing root causes.",
        createdAt: now,
      });
    }
  }

  return alerts;
}

/**
 * Get the highest alert level from a list of alerts.
 */
export function getHighestAlertLevel(
  alerts: SpiritualAlert[]
): "info" | "warning" | "critical" {
  if (alerts.some((a) => a.level === "critical")) return "critical";
  if (alerts.some((a) => a.level === "warning")) return "warning";
  return "info";
}

// ─── Helpers ────────────────────────────────────────────────────

function generateAlertId(): string {
  return (
    "salert_" +
    Math.random().toString(36).slice(2, 11) +
    Date.now().toString(36)
  );
}
