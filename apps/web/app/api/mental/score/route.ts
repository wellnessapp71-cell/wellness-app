/**
 * GET /api/mental/score — Get composite mental wellness score
 *
 * Computes the 4-signal weighted score from all available data:
 * - Baseline (35%)
 * - Daily check-ins (25%)
 * - rPPG scans (20%)
 * - Engagement (20%)
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
    const [baseline, checkins, scans, copingSessions, journalEntries, contentProgress] = await Promise.all([
      prisma.mentalBaseline.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.mentalCheckin.findMany({
        where: { userId },
        orderBy: { checkinDate: "desc" },
        take: 7,
      }),
      prisma.rppgScan.findMany({
        where: { userId },
        orderBy: { scannedAt: "desc" },
        take: 3,
      }),
      prisma.copingSession.findMany({
        where: { userId, completion: true },
        orderBy: { completedAt: "desc" },
        take: 20,
      }),
      prisma.journalEntry.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.contentProgress.findMany({
        where: { userId },
      }),
    ]);

    if (!baseline) {
      return errorResponse(404, "NO_BASELINE", "Complete the mental onboarding first.");
    }

    // ── Baseline component (0-100) ──
    const phq9Well = Math.round(((27 - baseline.phq9) / 27) * 100);
    const gad7Well = Math.round(((21 - baseline.gad7) / 21) * 100);
    const stressWell = Math.round(((10 - baseline.stressBase) / 9) * 100);
    const moodWell = Math.round(((baseline.moodBase - 1) / 9) * 100);
    const baselineComponent = Math.round(
      phq9Well * 0.35 + gad7Well * 0.30 + stressWell * 0.20 + moodWell * 0.15
    );

    // ── Daily component (0-100) ──
    let dailyComponent = 50;
    if (checkins.length > 0) {
      const avgScores = checkins.map((c: typeof checkins[number]) => {
        const mood = ((c.mood - 1) / 9) * 100;
        const stress = ((10 - c.stressManual) / 9) * 100;
        const anxiety = ((10 - c.anxiety) / 9) * 100;
        const energy = ((c.energy - 1) / 9) * 100;
        const focus = ((c.focus - 1) / 9) * 100;
        const sleepScore = c.sleep >= 7 && c.sleep <= 9 ? 100 : c.sleep >= 6 ? 75 : 50;
        return mood * 0.25 + stress * 0.20 + anxiety * 0.15 + energy * 0.15 + focus * 0.10 + sleepScore * 0.15;
      });
      dailyComponent = Math.round(avgScores.reduce((a: number, b: number) => a + b, 0) / avgScores.length);
    }

    // ── rPPG component (0-100) ──
    let rppgComponent = 50;
    const validScans = scans.filter((s: typeof scans[number]) => s.signalQuality >= 0.5);
    if (validScans.length > 0) {
      const avgStress = validScans.reduce(
        (sum: number, scan: typeof validScans[number]) => sum + scan.stressIndex,
        0
      ) / validScans.length;
      rppgComponent = Math.round(100 - avgStress);
    }

    // ── Engagement component (0-100) ──
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentCoping = copingSessions.filter(
      (s: typeof copingSessions[number]) => s.completedAt >= sevenDaysAgo
    );
    const recentJournal = journalEntries.filter(
      (j: typeof journalEntries[number]) => j.createdAt >= sevenDaysAgo
    );

    const copingScore = Math.min(30, recentCoping.length * 6);
    const journalScore = Math.min(25, recentJournal.length * 5);
    const checkInDays = new Set(
      checkins.map((c: typeof checkins[number]) => c.checkinDate.toISOString().split("T")[0])
    ).size;
    const checkInScore = Math.round((Math.min(7, checkInDays) / 7) * 25);
    const activeModules = contentProgress.filter(
      (c: typeof contentProgress[number]) => c.progressPercent > 0
    );
    const avgProgress = activeModules.length > 0
      ? activeModules.reduce(
          (sum: number, c: typeof activeModules[number]) => sum + c.progressPercent,
          0
        ) / activeModules.length
      : 0;
    const contentScore = Math.round((avgProgress / 100) * 20);
    const engagementComponent = Math.min(100, copingScore + journalScore + checkInScore + contentScore);

    // ── Weighted composite ──
    const compositeScore = Math.round(
      baselineComponent * 0.35 +
      dailyComponent * 0.25 +
      rppgComponent * 0.20 +
      engagementComponent * 0.20
    );

    return ok({
      compositeScore: Math.max(0, Math.min(100, compositeScore)),
      baselineComponent,
      dailyComponent,
      rppgComponent,
      engagementComponent,
      calculatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return errorResponse(500, "SCORE_CALC_ERROR", "Unable to compute mental wellness score.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
