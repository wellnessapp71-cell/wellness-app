import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import {
  generateFitnessTag,
  calculateMacroRequirements,
  projectGoal,
  getRecoverySuggestion,
  getMotivationalMessage,
  getStreakRewards,
  summarizeWorkoutProgress,
} from "@aura/fitness-engine";
import type { FitnessLevel, GoalType } from "@aura/types";
import { resolveAuthContext } from "@/lib/auth/middleware";
import { errorResponse, ok } from "@/lib/api/response";

/**
 * GET /api/progress/summary?userId=X
 * Returns a full ProgressDashboard for the gym section.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const auth = await resolveAuthContext(request, { allowAnonymousWhenCompat: true });
  const userId = auth?.userId ?? searchParams.get("userId") ?? "default";

  try {
    // Fetch recent workout logs, weight entries, check-ins in parallel
    const [workoutLogs, weightEntries, checkIns, profile] = await Promise.all([
      prisma.progress.findMany({
        where: { userId, type: "workout" },
        orderBy: { recordedAt: "desc" },
        take: 30,
      }),
      prisma.progress.findMany({
        where: { userId, type: "weight" },
        orderBy: { recordedAt: "desc" },
        take: 30,
      }),
      prisma.progress.findMany({
        where: { userId, type: "checkin" },
        orderBy: { recordedAt: "desc" },
        take: 7,
      }),
      prisma.profile.findUnique({ where: { userId } }),
    ]);

    const fitnessLevel = (profile?.fitnessLevel ?? "intermediate") as FitnessLevel;
    const goals: GoalType[] = ["fat_loss"];
    const weightKg = profile?.currentWeightKg ?? 70;
    const targetWeightKg = profile?.targetWeightKg ?? weightKg;
    const heightCm = profile?.heightCm ?? 170;
    const age = profile?.age ?? 28;
    const gender = (profile?.gender as any) ?? "other";
    const activityLevel = (profile?.activityLevel as string) ?? "moderate";

    // Fitness tag
    const fitnessTag = generateFitnessTag({
      fitnessLevel,
      goals,
      hasGymAccess: true,
      hasHomeEquipment: false,
    });

    // Macro requirements
    const macroRequirements = calculateMacroRequirements({
      weightKg,
      heightCm,
      age,
      gender,
      activityLevel,
      goal: targetWeightKg < weightKg ? "lose" : targetWeightKg > weightKg ? "gain" : "maintain",
    });

    // Goal projection
    const goalProjection =
      targetWeightKg !== weightKg
        ? projectGoal({
            goalType: targetWeightKg < weightKg ? "weight_loss" : "weight_gain",
            currentWeightKg: weightKg,
            targetWeightKg,
            weeklyDeficitOrSurplus: targetWeightKg < weightKg ? -3500 : 3500,
          })
        : null;

    // Streak & totals
    const sessionDates = workoutLogs.map((l) => {
      const d = l.recordedAt ?? new Date();
      return d.toISOString().split("T")[0];
    });
    const uniqueDays = [...new Set(sessionDates)].sort().reverse();
    let streakDays = 0;
    const now = new Date();
    for (let i = 0; i < uniqueDays.length; i++) {
      const expected = new Date(now);
      expected.setDate(expected.getDate() - i);
      if (uniqueDays[i] === expected.toISOString().split("T")[0]) {
        streakDays++;
      } else break;
    }

    const totalWorkouts = workoutLogs.length;
    const totalCaloriesBurned = workoutLogs.reduce((s, l) => {
      const data = l.data as any;
      return s + (data?.totalCaloriesBurned ?? data?.caloriesBurned ?? 0);
    }, 0);

    // Recovery suggestion
    const lastCheckIn = checkIns[0]?.data as any ?? null;
    const lastSession = workoutLogs[0]?.data as any;
    const recoverySuggestion = getRecoverySuggestion({
      lastCheckIn,
      streakDays,
      recentSessionsCount: workoutLogs.filter((l) => {
        const d = l.recordedAt ?? new Date();
        return Date.now() - d.getTime() < 7 * 86400000;
      }).length,
      lastSessionCompletionPercent: lastSession?.completionPercent,
    });

    // Weight history
    const weightHistory = weightEntries.map((e) => e.data as any).reverse();

    // Weekly completion for level progression
    const thisWeekLogs = workoutLogs.filter((l) => {
      const d = l.recordedAt ?? new Date();
      return Date.now() - d.getTime() < 7 * 86400000;
    });
    const weeklyCompletionPercent =
      thisWeekLogs.length > 0
        ? thisWeekLogs.reduce((s, l) => s + ((l.data as any)?.completionPercent ?? 0), 0) / thisWeekLogs.length
        : 0;

    // Motivational message
    const motivationalMessage = getMotivationalMessage({
      streakDays,
      completionPercent: weeklyCompletionPercent,
      fitnessLevel,
    });

    // Streak rewards
    const streakRewards = getStreakRewards(streakDays);

    return ok({
      fitnessTag,
      currentLevel: fitnessLevel,
      currentSublevel: 1,
      overallScore: weeklyCompletionPercent,
      weeklyCompletionPercent,
      streakDays,
      totalWorkouts,
      totalCaloriesBurned: Math.round(totalCaloriesBurned),
      weightHistory,
      goalProjection,
      macroRequirements,
      recoverySuggestion,
      streakRewards,
      motivationalMessage,
      recentSessions: workoutLogs.slice(0, 5).map((l) => l.data),
      formImprovementTrends: [],
    });
  } catch (err: any) {
    return errorResponse(500, "SUMMARY_ERROR", err?.message ?? "Failed to build progress summary");
  }
}
