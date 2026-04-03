/**
 * GET /api/mental/insights — Get trend data and AI-generated insights
 */

import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { resolveAuthContext } from "@/lib/auth/middleware";
import { errorResponse, ok } from "@/lib/api/response";

export async function GET(request: Request): Promise<NextResponse> {
  const auth = resolveAuthContext(request, { allowAnonymousWhenCompat: true });
  if (!auth) {
    return errorResponse(401, "UNAUTHORIZED", "Missing or invalid auth token.");
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get("userId") ?? auth.userId;
  const days = Math.min(parseInt(url.searchParams.get("days") ?? "7", 10), 30);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  try {
    const [checkins, scans, copingSessions, journalEntries] = await Promise.all([
      prisma.mentalCheckin.findMany({
        where: { userId, checkinDate: { gte: cutoff } },
        orderBy: { checkinDate: "asc" },
      }),
      prisma.rppgScan.findMany({
        where: { userId, scannedAt: { gte: cutoff } },
        orderBy: { scannedAt: "asc" },
      }),
      prisma.copingSession.findMany({
        where: { userId, completion: true, completedAt: { gte: cutoff } },
      }),
      prisma.journalEntry.findMany({
        where: { userId, createdAt: { gte: cutoff } },
      }),
    ]);

    // Build typed trend arrays
    type CheckIn = typeof checkins[number];
    type Scan = typeof scans[number];

    const moodTrend = checkins.map((c: CheckIn) => ({ date: c.checkinDate, value: c.mood }));
    const stressTrend = checkins.map((c: CheckIn) => ({ date: c.checkinDate, value: c.stressManual }));
    const sleepTrend = checkins.map((c: CheckIn) => ({ date: c.checkinDate, value: c.sleep }));
    const anxietyTrend = checkins.map((c: CheckIn) => ({ date: c.checkinDate, value: c.anxiety }));
    const energyTrend = checkins.map((c: CheckIn) => ({ date: c.checkinDate, value: c.energy }));
    const focusTrend = checkins.map((c: CheckIn) => ({ date: c.checkinDate, value: c.focus }));

    // Scan trend
    const scanTrend = scans.map((s: Scan) => ({
      date: s.scannedAt,
      stressIndex: s.stressIndex,
      heartRate: s.heartRate,
    }));

    // Trigger frequency
    const triggerCounts: Record<string, number> = {};
    for (const c of checkins) {
      const triggers = (c.stressTriggers as string[] | null) ?? [];
      for (const t of triggers) {
        triggerCounts[t] = (triggerCounts[t] ?? 0) + 1;
      }
    }
    const topTriggers = Object.entries(triggerCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Coping action frequency
    const copingCounts: Record<string, number> = {};
    for (const s of copingSessions) {
      copingCounts[s.interventionType] = (copingCounts[s.interventionType] ?? 0) + 1;
    }
    const topCopingActions = Object.entries(copingCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count);

    // Generate insights
    const insights: string[] = [];

    const avgSleep = checkins.length > 0
      ? checkins.reduce((sum: number, c: CheckIn) => sum + c.sleep, 0) / checkins.length
      : 0;
    const avgStress = checkins.length > 0
      ? checkins.reduce((sum: number, c: CheckIn) => sum + c.stressManual, 0) / checkins.length
      : 0;

    if (avgSleep >= 7 && avgStress <= 5) {
      insights.push("Your stress improved on days you slept at least 7 hours.");
    }
    if (copingSessions.length >= 3 && avgStress <= 5) {
      insights.push("Regular calming exercises are correlated with your lower stress levels.");
    }
    if (journalEntries.length >= 3) {
      insights.push("Consistent journaling is helping you process emotions effectively.");
    }
    if (scans.length >= 2) {
      insights.push("Regular stress scans help you stay aware of your stress patterns.");
    }
    if (insights.length === 0) {
      insights.push("Keep checking in daily to build meaningful insights about your patterns.");
    }

    // Escalation events
    const escalationEvents = checkins.filter((c: CheckIn) => c.stressManual >= 8).length +
      scans.filter((s: Scan) => s.stressIndex >= 80).length;

    return ok({
      windowDays: days,
      trends: {
        mood: moodTrend,
        stress: stressTrend,
        sleep: sleepTrend,
        anxiety: anxietyTrend,
        energy: energyTrend,
        focus: focusTrend,
        scans: scanTrend,
      },
      summary: {
        totalCheckIns: checkins.length,
        totalScans: scans.length,
        totalCopingSessions: copingSessions.length,
        totalJournalEntries: journalEntries.length,
        escalationEvents,
        avgMood: checkins.length > 0
          ? Math.round((checkins.reduce((sum: number, c: CheckIn) => sum + c.mood, 0) / checkins.length) * 10) / 10
          : null,
        avgStress: checkins.length > 0 ? Math.round(avgStress * 10) / 10 : null,
        avgSleep: checkins.length > 0 ? Math.round(avgSleep * 10) / 10 : null,
      },
      topTriggers,
      topCopingActions,
      insights,
    });
  } catch (error) {
    return errorResponse(500, "INSIGHTS_ERROR", "Unable to generate insights.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
