/**
 * POST /api/lifestyle/checkin — Submit daily lifestyle check-in
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

  if (!body.date || typeof body.sleepHours !== "number" || typeof body.waterMl !== "number") {
    return errorResponse(400, "INVALID_CHECKIN", "date, sleepHours, and waterMl are required.");
  }

  const userId = auth.isLegacy ? (body.userId ?? auth.userId) : auth.userId;

  try {
    const checkin = await prisma.lifestyleCheckin.upsert({
      where: { userId_date: { userId, date: body.date } },
      update: {
        sleepHours: body.sleepHours,
        sleepQuality: body.sleepQuality ?? 5,
        mealsEaten: body.mealsEaten,
        fruitServings: body.fruitServings,
        vegServings: body.vegServings,
        fruitVegServings: body.fruitVegServings,
        proteinFiberMeals: body.proteinFiberMeals,
        ultraProcessedServings: body.ultraProcessedServings,
        sugaryServings: body.sugaryServings,
        lateEatingCount: body.lateEatingCount,
        stressEating: body.stressEating,
        waterMl: body.waterMl,
        waterBeforeNoon: body.waterBeforeNoon,
        hydrationSpanHours: body.hydrationSpanHours,
        metWaterGoal: body.metWaterGoal,
        activeMinutes: body.activeMinutes,
        movementBreaks: body.movementBreaks,
        strengthOrYoga: body.strengthOrYoga,
        sittingMinutesMax: body.sittingMinutesMax,
        strengthYogaDone: body.strengthYogaDone,
        screenMinutesNonWork: body.screenMinutesNonWork,
        screenHoursNonWork: body.screenHoursNonWork,
        bedtimeScreenMinutes: body.bedtimeScreenMinutes,
        notificationsAfter8pm: body.notificationsAfter8pm,
        usedFocusMode: body.usedFocusMode,
        outdoorMinutes: body.outdoorMinutes,
        morningDaylightMinutes: body.morningDaylightMinutes,
        gotOutdoors: body.gotOutdoors,
        morningRoutineDone: body.morningRoutineDone,
        eveningRoutineDone: body.eveningRoutineDone,
        sameWakeTimeDays: body.sameWakeTimeDays,
        routineCompletion: body.routineCompletion,
        blockers: body.blockers ?? [],
      },
      create: {
        userId,
        date: body.date,
        sleepHours: body.sleepHours,
        sleepQuality: body.sleepQuality ?? 5,
        mealsEaten: body.mealsEaten,
        fruitServings: body.fruitServings,
        vegServings: body.vegServings,
        fruitVegServings: body.fruitVegServings,
        proteinFiberMeals: body.proteinFiberMeals,
        ultraProcessedServings: body.ultraProcessedServings,
        sugaryServings: body.sugaryServings,
        lateEatingCount: body.lateEatingCount,
        stressEating: body.stressEating,
        waterMl: body.waterMl,
        waterBeforeNoon: body.waterBeforeNoon,
        hydrationSpanHours: body.hydrationSpanHours,
        metWaterGoal: body.metWaterGoal,
        activeMinutes: body.activeMinutes,
        movementBreaks: body.movementBreaks,
        strengthOrYoga: body.strengthOrYoga,
        sittingMinutesMax: body.sittingMinutesMax,
        strengthYogaDone: body.strengthYogaDone,
        screenMinutesNonWork: body.screenMinutesNonWork,
        screenHoursNonWork: body.screenHoursNonWork,
        bedtimeScreenMinutes: body.bedtimeScreenMinutes,
        notificationsAfter8pm: body.notificationsAfter8pm,
        usedFocusMode: body.usedFocusMode,
        outdoorMinutes: body.outdoorMinutes,
        morningDaylightMinutes: body.morningDaylightMinutes,
        gotOutdoors: body.gotOutdoors,
        morningRoutineDone: body.morningRoutineDone,
        eveningRoutineDone: body.eveningRoutineDone,
        sameWakeTimeDays: body.sameWakeTimeDays,
        routineCompletion: body.routineCompletion,
        blockers: body.blockers ?? [],
      },
    });

    return ok({ checkinId: checkin.id, date: checkin.date });
  } catch (error) {
    return errorResponse(500, "CHECKIN_SAVE_ERROR", "Unable to save lifestyle check-in.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
