/**
 * Lifestyle wellness local storage — AsyncStorage-backed, offline-first.
 * Key: @aura/lifestyle
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  LifestyleBaseline,
  LifestyleDailyCheckIn,
  LifestyleWeeklyReview,
  LifestyleMonthlyReview,
  LifestyleWellnessPlan,
  LifestyleScoreRun,
  LifestyleGoals,
  SleepLog,
  MealLog,
  HydrationLog,
  MovementLog,
  DigitalBalanceLog,
  NatureLog,
  RoutineCompletion,
} from "@aura/types";

const KEY = "@aura/lifestyle";

interface LifestyleState {
  baseline?: LifestyleBaseline;
  checkIns?: LifestyleDailyCheckIn[];
  weeklyReviews?: LifestyleWeeklyReview[];
  monthlyReviews?: LifestyleMonthlyReview[];
  plan?: LifestyleWellnessPlan;
  scoreHistory?: LifestyleScoreRun[];
  goals?: LifestyleGoals;
  sleepLogs?: SleepLog[];
  mealLogs?: MealLog[];
  hydrationLogs?: HydrationLog[];
  movementLogs?: MovementLog[];
  digitalLogs?: DigitalBalanceLog[];
  natureLogs?: NatureLog[];
  routineCompletions?: RoutineCompletion[];
}

async function getState(): Promise<LifestyleState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LifestyleState) : {};
  } catch {
    return {};
  }
}

async function setState(partial: Partial<LifestyleState>): Promise<void> {
  try {
    const current = await getState();
    await AsyncStorage.setItem(KEY, JSON.stringify({ ...current, ...partial }));
  } catch {
    // silently fail in dev
  }
}

// ── Baseline ────────────────────────────────────────────────────

export async function saveLifestyleBaseline(baseline: LifestyleBaseline): Promise<void> {
  await setState({ baseline });
}

export async function getLifestyleBaseline(): Promise<LifestyleBaseline | null> {
  const state = await getState();
  return state.baseline ?? null;
}

// ── Check-ins ───────────────────────────────────────────────────

export async function saveLifestyleCheckIn(checkIn: LifestyleDailyCheckIn): Promise<void> {
  const state = await getState();
  const checkIns = state.checkIns ?? [];
  const idx = checkIns.findIndex((c) => c.date === checkIn.date);
  if (idx >= 0) checkIns[idx] = checkIn;
  else checkIns.push(checkIn);
  if (checkIns.length > 30) checkIns.splice(0, checkIns.length - 30);
  await setState({ checkIns });
}

export async function getLifestyleCheckIns(): Promise<LifestyleDailyCheckIn[]> {
  const state = await getState();
  return state.checkIns ?? [];
}

export async function getTodayLifestyleCheckIn(): Promise<LifestyleDailyCheckIn | null> {
  const today = new Date().toISOString().split("T")[0];
  const checkIns = await getLifestyleCheckIns();
  return checkIns.find((c) => c.date === today) ?? null;
}

// ── Weekly reviews ──────────────────────────────────────────────

export async function saveWeeklyReview(review: LifestyleWeeklyReview): Promise<void> {
  const state = await getState();
  const reviews = state.weeklyReviews ?? [];
  reviews.push(review);
  if (reviews.length > 12) reviews.splice(0, reviews.length - 12);
  await setState({ weeklyReviews: reviews });
}

export async function getWeeklyReviews(): Promise<LifestyleWeeklyReview[]> {
  const state = await getState();
  return state.weeklyReviews ?? [];
}

// ── Monthly reviews ─────────────────────────────────────────────

export async function saveMonthlyReview(review: LifestyleMonthlyReview): Promise<void> {
  const state = await getState();
  const reviews = state.monthlyReviews ?? [];
  reviews.push(review);
  if (reviews.length > 6) reviews.splice(0, reviews.length - 6);
  await setState({ monthlyReviews: reviews });
}

export async function getMonthlyReviews(): Promise<LifestyleMonthlyReview[]> {
  const state = await getState();
  return state.monthlyReviews ?? [];
}

// ── Plan ────────────────────────────────────────────────────────

export async function saveLifestylePlan(plan: LifestyleWellnessPlan): Promise<void> {
  await setState({ plan });
}

export async function getLifestylePlan(): Promise<LifestyleWellnessPlan | null> {
  const state = await getState();
  return state.plan ?? null;
}

// ── Score history ───────────────────────────────────────────────

export async function saveScoreRun(run: LifestyleScoreRun): Promise<void> {
  const state = await getState();
  const history = state.scoreHistory ?? [];
  history.push(run);
  if (history.length > 30) history.splice(0, history.length - 30);
  await setState({ scoreHistory: history });
}

export async function getScoreHistory(): Promise<LifestyleScoreRun[]> {
  const state = await getState();
  return state.scoreHistory ?? [];
}

// ── Goals ───────────────────────────────────────────────────────

export async function saveLifestyleGoals(goals: LifestyleGoals): Promise<void> {
  await setState({ goals });
}

export async function getLifestyleGoals(): Promise<LifestyleGoals | null> {
  const state = await getState();
  return state.goals ?? null;
}

// ── Domain logs ─────────────────────────────────────────────────

export async function saveSleepLog(log: SleepLog): Promise<void> {
  const state = await getState();
  const logs = state.sleepLogs ?? [];
  logs.push(log);
  if (logs.length > 30) logs.splice(0, logs.length - 30);
  await setState({ sleepLogs: logs });
}

export async function getSleepLogs(): Promise<SleepLog[]> {
  const state = await getState();
  return state.sleepLogs ?? [];
}

export async function saveMealLog(log: MealLog): Promise<void> {
  const state = await getState();
  const logs = state.mealLogs ?? [];
  logs.push(log);
  if (logs.length > 60) logs.splice(0, logs.length - 60);
  await setState({ mealLogs: logs });
}

export async function getMealLogs(): Promise<MealLog[]> {
  const state = await getState();
  return state.mealLogs ?? [];
}

export async function saveHydrationLog(log: HydrationLog): Promise<void> {
  const state = await getState();
  const logs = state.hydrationLogs ?? [];
  logs.push(log);
  if (logs.length > 60) logs.splice(0, logs.length - 60);
  await setState({ hydrationLogs: logs });
}

export async function getHydrationLogs(): Promise<HydrationLog[]> {
  const state = await getState();
  return state.hydrationLogs ?? [];
}

export async function saveMovementLog(log: MovementLog): Promise<void> {
  const state = await getState();
  const logs = state.movementLogs ?? [];
  logs.push(log);
  if (logs.length > 30) logs.splice(0, logs.length - 30);
  await setState({ movementLogs: logs });
}

export async function getMovementLogs(): Promise<MovementLog[]> {
  const state = await getState();
  return state.movementLogs ?? [];
}

export async function saveDigitalLog(log: DigitalBalanceLog): Promise<void> {
  const state = await getState();
  const logs = state.digitalLogs ?? [];
  logs.push(log);
  if (logs.length > 30) logs.splice(0, logs.length - 30);
  await setState({ digitalLogs: logs });
}

export async function getDigitalLogs(): Promise<DigitalBalanceLog[]> {
  const state = await getState();
  return state.digitalLogs ?? [];
}

export async function saveNatureLog(log: NatureLog): Promise<void> {
  const state = await getState();
  const logs = state.natureLogs ?? [];
  logs.push(log);
  if (logs.length > 30) logs.splice(0, logs.length - 30);
  await setState({ natureLogs: logs });
}

export async function getNatureLogs(): Promise<NatureLog[]> {
  const state = await getState();
  return state.natureLogs ?? [];
}

export async function saveRoutineCompletion(entry: RoutineCompletion): Promise<void> {
  const state = await getState();
  const entries = state.routineCompletions ?? [];
  entries.push(entry);
  if (entries.length > 60) entries.splice(0, entries.length - 60);
  await setState({ routineCompletions: entries });
}

export async function getRoutineCompletions(): Promise<RoutineCompletion[]> {
  const state = await getState();
  return state.routineCompletions ?? [];
}

// ── Clear all ───────────────────────────────────────────────────

export async function clearLifestyleData(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
