/**
 * Lifestyle bidirectional sync service.
 *
 * Pushes local data to the server and pulls server updates back.
 * Uses a lastSyncAt timestamp for incremental sync.
 * Offline-first: all sync failures are silently caught.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "@/lib/api";
import {
  getLifestyleBaseline,
  getLifestyleCheckIns,
  getLifestylePlan,
  getWeeklyReviews,
  getMonthlyReviews,
  getScoreHistory,
  saveLifestyleBaseline,
  saveLifestyleCheckIn,
  saveLifestylePlan,
  saveWeeklyReview,
  saveMonthlyReview,
  saveScoreRun,
} from "@/lib/lifestyle-store";
import type {
  LifestyleBaseline,
  LifestyleDailyCheckIn,
  LifestyleWellnessPlan,
  LifestyleWeeklyReview,
  LifestyleMonthlyReview,
  LifestyleScoreRun,
} from "@aura/types";

const SYNC_KEY = "@aura/lifestyle-sync";

interface SyncState {
  lastSyncAt: string | null;
}

async function getSyncState(): Promise<SyncState> {
  try {
    const raw = await AsyncStorage.getItem(SYNC_KEY);
    return raw ? JSON.parse(raw) : { lastSyncAt: null };
  } catch {
    return { lastSyncAt: null };
  }
}

async function setSyncState(state: SyncState): Promise<void> {
  try {
    await AsyncStorage.setItem(SYNC_KEY, JSON.stringify(state));
  } catch {
    // silently fail
  }
}

/**
 * Full bidirectional sync with the server.
 * Call on app launch and after significant local changes.
 */
export async function syncLifestyleData(): Promise<void> {
  try {
    const syncState = await getSyncState();
    const lastSyncAt = syncState.lastSyncAt;

    // Gather local data to push
    const [baseline, checkIns, plan, weeklyReviews, monthlyReviews, scoreHistory] =
      await Promise.all([
        getLifestyleBaseline(),
        getLifestyleCheckIns(),
        getLifestylePlan(),
        getWeeklyReviews(),
        getMonthlyReviews(),
        getScoreHistory(),
      ]);

    // Filter to only send data created after last sync
    const newCheckIns = lastSyncAt
      ? checkIns.filter((c) => c.createdAt > lastSyncAt)
      : checkIns;
    const newWeeklyReviews = lastSyncAt
      ? weeklyReviews.filter((r) => r.createdAt > lastSyncAt)
      : weeklyReviews;
    const newMonthlyReviews = lastSyncAt
      ? monthlyReviews.filter((r) => r.createdAt > lastSyncAt)
      : monthlyReviews;
    const newScoreRuns = lastSyncAt
      ? scoreHistory.filter((s) => s.createdAt > lastSyncAt)
      : scoreHistory;

    const pushPayload: Record<string, any> = {
      lastSyncAt: lastSyncAt ?? undefined,
    };

    // Only push baseline if it exists and is newer than last sync
    if (baseline && (!lastSyncAt || baseline.createdAt > lastSyncAt)) {
      pushPayload.baseline = baseline;
    }
    if (newCheckIns.length > 0) pushPayload.checkIns = newCheckIns;
    if (plan && (!lastSyncAt || plan.createdAt > lastSyncAt)) {
      pushPayload.plan = plan;
    }
    if (newWeeklyReviews.length > 0) pushPayload.weeklyReviews = newWeeklyReviews;
    if (newMonthlyReviews.length > 0) pushPayload.monthlyReviews = newMonthlyReviews;

    // Call sync endpoint
    const response = await api.post<{
      baseline: any | null;
      checkIns: any[];
      plan: any | null;
      weeklyReviews: any[];
      monthlyReviews: any[];
      scoreRuns: any[];
      syncedAt: string;
    }>("/lifestyle/sync", pushPayload);

    // Pull: merge server data into local store
    // Baseline: use server's if newer
    if (response.baseline && baseline) {
      if (new Date(response.baseline.createdAt) > new Date(baseline.createdAt)) {
        await saveLifestyleBaseline(response.baseline);
      }
    } else if (response.baseline && !baseline) {
      await saveLifestyleBaseline(response.baseline);
    }

    // Check-ins: merge by date (server wins if exists)
    if (response.checkIns?.length > 0) {
      const localDates = new Set(checkIns.map((c) => c.date));
      for (const serverCheckin of response.checkIns) {
        if (!localDates.has(serverCheckin.date)) {
          await saveLifestyleCheckIn(serverCheckin);
        }
      }
    }

    // Plan: use server's active plan if we don't have one or server's is newer
    if (response.plan) {
      if (!plan || new Date(response.plan.createdAt) > new Date(plan.createdAt)) {
        await saveLifestylePlan(response.plan);
      }
    }

    // Weekly reviews: merge by weekStart
    if (response.weeklyReviews?.length > 0) {
      const localWeekStarts = new Set(weeklyReviews.map((r) => r.weekStart));
      for (const serverReview of response.weeklyReviews) {
        if (!localWeekStarts.has(serverReview.weekStart)) {
          await saveWeeklyReview(serverReview);
        }
      }
    }

    // Monthly reviews: merge by month
    if (response.monthlyReviews?.length > 0) {
      const localMonths = new Set(monthlyReviews.map((r) => r.month));
      for (const serverReview of response.monthlyReviews) {
        if (!localMonths.has(serverReview.month)) {
          await saveMonthlyReview(serverReview);
        }
      }
    }

    // Score runs: merge by createdAt
    if (response.scoreRuns?.length > 0) {
      const localScoreTimes = new Set(scoreHistory.map((s) => s.createdAt));
      for (const serverScore of response.scoreRuns) {
        if (!localScoreTimes.has(serverScore.createdAt)) {
          await saveScoreRun(serverScore);
        }
      }
    }

    // Update sync timestamp
    await setSyncState({ lastSyncAt: response.syncedAt });
  } catch {
    // Offline-first: sync failures are expected when offline
  }
}

/**
 * Quick push of a single entity to the server (fire & forget).
 * Used right after creating/updating data locally.
 */
export async function pushBaseline(baseline: LifestyleBaseline): Promise<void> {
  try {
    await api.post("/lifestyle/baseline", {
      sleepScore: baseline.sleepScore,
      nutritionScore: baseline.nutritionScore,
      hydrationScore: baseline.hydrationScore,
      movementScore: baseline.movementScore,
      digitalScore: baseline.digitalScore,
      natureScore: baseline.natureScore,
      routineScore: baseline.routineScore,
      totalScore: baseline.totalScore,
      band: baseline.band,
      weakestDomain: baseline.weakestDomain,
      rawAnswers: baseline.rawAnswers,
    });
  } catch {
    // offline-first
  }
}

export async function pushCheckIn(checkIn: LifestyleDailyCheckIn): Promise<void> {
  try {
    await api.post("/lifestyle/checkin", checkIn);
  } catch {
    // offline-first
  }
}

export async function pushPlan(plan: LifestyleWellnessPlan): Promise<void> {
  try {
    await api.post("/lifestyle/plan", plan);
  } catch {
    // offline-first
  }
}

export async function pushWeeklyReview(review: LifestyleWeeklyReview): Promise<void> {
  try {
    await api.post("/lifestyle/weekly-review", review);
  } catch {
    // offline-first
  }
}

export async function pushMonthlyReview(review: LifestyleMonthlyReview): Promise<void> {
  try {
    await api.post("/lifestyle/monthly-review", review);
  } catch {
    // offline-first
  }
}

export async function pushScoreRun(score: LifestyleScoreRun): Promise<void> {
  try {
    await api.post("/lifestyle/score", score);
  } catch {
    // offline-first
  }
}
