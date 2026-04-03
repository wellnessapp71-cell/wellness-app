/**
 * GET /api/spiritual/score — Get composite spiritual wellness score
 *
 * Computes the 4-signal weighted score from all available data:
 * - Baseline (35%)
 * - Daily check-ins (25%)
 * - Engagement (20%)
 * - Practice (20%)
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

  try {
    // Fetch all signals in parallel
    const [baseline, checkins, sessions, journalEntries] = await Promise.all([
      prisma.spiritualBaseline.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.spiritualCheckin.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        take: 7,
      }),
      prisma.spiritualPracticeSession.findMany({
        where: { userId },
        orderBy: { completedAt: "desc" },
        take: 50,
      }),
      prisma.spiritualJournalEntry.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    if (!baseline) {
      return errorResponse(404, "NO_BASELINE", "Complete the spiritual onboarding first.");
    }

    // ── Baseline component (0-100) ──
    const baselineComponent = Math.max(0, Math.min(100, baseline.totalScore));

    // ── Daily component (0-100) ──
    let dailyComponent = 50;
    if (checkins.length > 0) {
      const avgCalm = checkins.reduce(
        (sum: number, c: typeof checkins[number]) => sum + c.calmScore, 0
      ) / checkins.length;
      dailyComponent = Math.round((avgCalm / 10) * 100);
    }

    // ── Engagement component (0-100) ──
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentJournal = journalEntries.filter(
      (j: typeof journalEntries[number]) => j.createdAt >= sevenDaysAgo
    );
    const journalScore = Math.min(40, Math.round((recentJournal.length / 3) * 40));
    const checkInDays = new Set(
      checkins.map((c: typeof checkins[number]) => c.date)
    ).size;
    const checkInScore = Math.round((Math.min(7, checkInDays) / 7) * 35);
    const engagementComponent = Math.min(100, journalScore + checkInScore + 25);

    // ── Practice component (0-100) ──
    const recentSessions = sessions.filter(
      (s: typeof sessions[number]) => s.completedAt >= sevenDaysAgo
    );
    const totalMinutes = recentSessions.reduce(
      (sum: number, s: typeof recentSessions[number]) => sum + s.durationMinutes, 0
    );
    const minuteScore = Math.min(40, Math.round((totalMinutes / 70) * 40));
    const practiceComponent = Math.min(100, minuteScore + 35 + 25);

    // ── Weighted composite ──
    const compositeScore = Math.round(
      baselineComponent * 0.35 +
      dailyComponent * 0.25 +
      engagementComponent * 0.20 +
      practiceComponent * 0.20
    );

    // Band classification
    let band = "red";
    if (compositeScore >= 80) band = "green";
    else if (compositeScore >= 60) band = "yellow";
    else if (compositeScore >= 40) band = "orange";

    return ok({
      compositeScore: Math.max(0, Math.min(100, compositeScore)),
      baselineComponent,
      dailyComponent,
      engagementComponent,
      practiceComponent,
      band,
      domainScores: {
        meaning: baseline.meaningScore,
        peace: baseline.peaceScore,
        mindfulness: baseline.mindfulnessScore,
        connection: baseline.connectionScore,
        practice: baseline.practiceScore,
      },
      calculatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return errorResponse(500, "SCORE_CALC_ERROR", "Unable to compute spiritual wellness score.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
