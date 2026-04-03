/**
 * POST /api/lifestyle/sync — Full bidirectional sync endpoint
 *
 * The mobile app calls this on launch and periodically to push local data
 * and pull any server-side updates. This ensures web and mobile stay in sync.
 *
 * Request body:
 * {
 *   lastSyncAt?: string (ISO);    // client's last sync timestamp
 *   baseline?: object;             // push latest baseline if newer
 *   checkIns?: object[];           // push check-ins since lastSyncAt
 *   plan?: object;                 // push current plan
 *   weeklyReviews?: object[];      // push reviews since lastSyncAt
 *   monthlyReviews?: object[];     // push reviews since lastSyncAt
 *   scoreRuns?: object[];          // push score runs since lastSyncAt
 * }
 *
 * Response:
 * {
 *   baseline?: object;             // server's latest baseline (if newer)
 *   checkIns: object[];            // server check-ins since lastSyncAt
 *   plan?: object;                 // server's active plan
 *   weeklyReviews: object[];       // server reviews since lastSyncAt
 *   monthlyReviews: object[];      // server reviews since lastSyncAt
 *   scoreRuns: object[];           // server scores since lastSyncAt
 *   syncedAt: string;              // new sync timestamp
 * }
 */

import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { resolveAuthContext } from "@/lib/auth/middleware";
import { errorResponse, ok } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";

export async function POST(request: Request): Promise<NextResponse> {
  const auth = resolveAuthContext(request, { allowAnonymousWhenCompat: true });
  if (!auth) {
    return errorResponse(401, "UNAUTHORIZED", "Missing or invalid auth token.");
  }

  const parsed = await parseRequestJson(request);
  if (!parsed.success) {
    return errorResponse(parsed.status ?? 400, "INVALID_JSON", parsed.error);
  }

  const body = parsed.data as Record<string, any>;
  const userId = auth.isLegacy ? (body.userId ?? auth.userId) : auth.userId;
  const lastSyncAt = body.lastSyncAt ? new Date(body.lastSyncAt) : new Date(0);
  const syncedAt = new Date();

  try {
    // ── Push: baseline ──
    if (body.baseline) {
      const b = body.baseline;
      const existing = await prisma.lifestyleBaseline.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      // Only create if client baseline is newer or none exists
      if (!existing || new Date(b.createdAt) > existing.createdAt) {
        await prisma.lifestyleBaseline.create({
          data: {
            userId,
            sleepScore: b.sleepScore,
            nutritionScore: b.nutritionScore,
            hydrationScore: b.hydrationScore,
            movementScore: b.movementScore,
            digitalScore: b.digitalScore,
            natureScore: b.natureScore,
            routineScore: b.routineScore,
            totalScore: b.totalScore,
            band: b.band,
            weakestDomain: b.weakestDomain,
            rawAnswers: b.rawAnswers,
          },
        });
        await prisma.profile.updateMany({
          where: { userId },
          data: { scoreLifestyle: b.totalScore, lifestyleOnboardingDone: true },
        });
      }
    }

    // ── Push: check-ins ──
    if (Array.isArray(body.checkIns)) {
      for (const c of body.checkIns) {
        await prisma.lifestyleCheckin.upsert({
          where: { userId_date: { userId, date: c.date } },
          update: {
            sleepHours: c.sleepHours,
            sleepQuality: c.sleepQuality ?? 5,
            mealsEaten: c.mealsEaten,
            fruitServings: c.fruitServings,
            vegServings: c.vegServings,
            fruitVegServings: c.fruitVegServings,
            proteinFiberMeals: c.proteinFiberMeals,
            ultraProcessedServings: c.ultraProcessedServings,
            sugaryServings: c.sugaryServings,
            lateEatingCount: c.lateEatingCount,
            stressEating: c.stressEating,
            waterMl: c.waterMl,
            waterBeforeNoon: c.waterBeforeNoon,
            hydrationSpanHours: c.hydrationSpanHours,
            metWaterGoal: c.metWaterGoal,
            activeMinutes: c.activeMinutes,
            movementBreaks: c.movementBreaks,
            strengthOrYoga: c.strengthOrYoga,
            sittingMinutesMax: c.sittingMinutesMax,
            strengthYogaDone: c.strengthYogaDone,
            screenMinutesNonWork: c.screenMinutesNonWork,
            screenHoursNonWork: c.screenHoursNonWork,
            bedtimeScreenMinutes: c.bedtimeScreenMinutes,
            notificationsAfter8pm: c.notificationsAfter8pm,
            usedFocusMode: c.usedFocusMode,
            outdoorMinutes: c.outdoorMinutes,
            morningDaylightMinutes: c.morningDaylightMinutes,
            gotOutdoors: c.gotOutdoors,
            morningRoutineDone: c.morningRoutineDone,
            eveningRoutineDone: c.eveningRoutineDone,
            sameWakeTimeDays: c.sameWakeTimeDays,
            routineCompletion: c.routineCompletion,
            blockers: c.blockers ?? [],
          },
          create: {
            userId,
            date: c.date,
            sleepHours: c.sleepHours,
            sleepQuality: c.sleepQuality ?? 5,
            mealsEaten: c.mealsEaten,
            fruitServings: c.fruitServings,
            vegServings: c.vegServings,
            fruitVegServings: c.fruitVegServings,
            proteinFiberMeals: c.proteinFiberMeals,
            ultraProcessedServings: c.ultraProcessedServings,
            sugaryServings: c.sugaryServings,
            lateEatingCount: c.lateEatingCount,
            stressEating: c.stressEating,
            waterMl: c.waterMl,
            waterBeforeNoon: c.waterBeforeNoon,
            hydrationSpanHours: c.hydrationSpanHours,
            metWaterGoal: c.metWaterGoal,
            activeMinutes: c.activeMinutes,
            movementBreaks: c.movementBreaks,
            strengthOrYoga: c.strengthOrYoga,
            sittingMinutesMax: c.sittingMinutesMax,
            strengthYogaDone: c.strengthYogaDone,
            screenMinutesNonWork: c.screenMinutesNonWork,
            screenHoursNonWork: c.screenHoursNonWork,
            bedtimeScreenMinutes: c.bedtimeScreenMinutes,
            notificationsAfter8pm: c.notificationsAfter8pm,
            usedFocusMode: c.usedFocusMode,
            outdoorMinutes: c.outdoorMinutes,
            morningDaylightMinutes: c.morningDaylightMinutes,
            gotOutdoors: c.gotOutdoors,
            morningRoutineDone: c.morningRoutineDone,
            eveningRoutineDone: c.eveningRoutineDone,
            sameWakeTimeDays: c.sameWakeTimeDays,
            routineCompletion: c.routineCompletion,
            blockers: c.blockers ?? [],
          },
        });
      }
    }

    // ── Push: plan ──
    if (body.plan) {
      const p = body.plan;
      await prisma.lifestylePlan.updateMany({
        where: { userId, active: true },
        data: { active: false },
      });
      await prisma.lifestylePlan.create({
        data: {
          userId,
          dailyAnchorHabit: p.dailyAnchorHabit,
          recoveryHabit: p.recoveryHabit ?? "",
          weeklyGoal: p.weeklyGoal ?? "",
          trendInsight: p.trendInsight,
          bestNextAction: p.bestNextAction ?? p.dailyAnchorHabit,
          followUpTime: p.followUpTime ?? "morning",
          expertRecommendation: p.expertRecommendation,
          focusDomain: p.focusDomain,
          supportDomain: p.supportDomain,
          band: p.band,
          active: true,
        },
      });
    }

    // ── Push: weekly reviews ──
    if (Array.isArray(body.weeklyReviews)) {
      for (const r of body.weeklyReviews) {
        await prisma.lifestyleWeeklyReview.create({
          data: {
            userId,
            weekStart: r.weekStart,
            weekEnd: r.weekEnd,
            goodSleepDays: r.goodSleepDays ?? 0,
            hydrationTargetDays: r.hydrationTargetDays ?? 0,
            mealLogDays: r.mealLogDays ?? 0,
            balancedMealDays: r.balancedMealDays,
            movementDays: r.movementDays ?? 0,
            moderateActivityDays: r.moderateActivityDays,
            strengthYogaDays: r.strengthYogaDays,
            screenInterferenceDays: r.screenInterferenceDays ?? 0,
            screenUnderLimitDays: r.screenUnderLimitDays,
            outdoorDays: r.outdoorDays ?? 0,
            routineDays: r.routineDays,
            helpedMostHabit: r.helpedMostHabit,
            blockedMostHabit: r.blockedMostHabit,
            scoreChange: r.scoreChange ?? 0,
          },
        });
      }
    }

    // ── Push: monthly reviews ──
    if (Array.isArray(body.monthlyReviews)) {
      for (const r of body.monthlyReviews) {
        await prisma.lifestyleMonthlyReview.create({
          data: {
            userId,
            month: r.month,
            sleepImproved: r.sleepImproved ?? false,
            mealQualityImproved: r.mealQualityImproved ?? false,
            hydrationImproved: r.hydrationImproved ?? false,
            movementImproved: r.movementImproved ?? false,
            screenBalanceImproved: r.screenBalanceImproved ?? false,
            natureImproved: r.natureImproved ?? false,
            routineImproved: r.routineImproved ?? false,
            mostImprovedDomain: r.mostImprovedDomain,
            worstDomain: r.worstDomain,
            planPreference: r.planPreference ?? "same",
          },
        });
      }
    }

    // ── Pull: return server data newer than lastSyncAt ──
    const [serverBaseline, serverCheckins, serverPlan, serverWeekly, serverMonthly, serverScores] =
      await Promise.all([
        prisma.lifestyleBaseline.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
        }),
        prisma.lifestyleCheckin.findMany({
          where: { userId, createdAt: { gte: lastSyncAt } },
          orderBy: { date: "desc" },
          take: 100,
        }),
        prisma.lifestylePlan.findFirst({
          where: { userId, active: true },
          orderBy: { createdAt: "desc" },
        }),
        prisma.lifestyleWeeklyReview.findMany({
          where: { userId, createdAt: { gte: lastSyncAt } },
          orderBy: { createdAt: "desc" },
          take: 12,
        }),
        prisma.lifestyleMonthlyReview.findMany({
          where: { userId, createdAt: { gte: lastSyncAt } },
          orderBy: { createdAt: "desc" },
          take: 6,
        }),
        prisma.lifestyleScoreRun.findMany({
          where: { userId, createdAt: { gte: lastSyncAt } },
          orderBy: { createdAt: "desc" },
          take: 30,
        }),
      ]);

    return ok({
      baseline: serverBaseline,
      checkIns: serverCheckins,
      plan: serverPlan,
      weeklyReviews: serverWeekly,
      monthlyReviews: serverMonthly,
      scoreRuns: serverScores,
      syncedAt: syncedAt.toISOString(),
    });
  } catch (error) {
    return errorResponse(500, "SYNC_ERROR", "Lifestyle sync failed.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
