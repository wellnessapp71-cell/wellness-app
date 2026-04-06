import AsyncStorage from "@react-native-async-storage/async-storage";
import type { MentalBaseline, MentalWellnessPlan, RppgScanResult } from "@aura/types";

const KEY = "@aura/onboarding";

export interface UserProfile {
  userId: string;
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  heightCm: number;
  weightKg: number;
  targetWeightKg?: number;
  bodyShape?: "lean" | "average" | "athletic" | "heavy";
  email?: string;
}

export interface DailyCheckInLocal {
  dateIso: string;
  mood: "great" | "good" | "okay" | "low" | "bad";
  energy: "high" | "moderate" | "low" | "exhausted";
  sleepHours: number;
  sleepQuality: 1 | 2 | 3 | 4 | 5;
  fatigueLevel: 1 | 2 | 3 | 4 | 5;
  soreness: 1 | 2 | 3 | 4 | 5;
}

export interface WeightEntryLocal {
  dateIso: string;
  weightKg: number;
}

export interface SessionLogRef {
  sessionId: string;
  dateIso: string;
  day: string;
  focus: string | null;
  completionPercent: number;
  caloriesBurned: number;
  durationMinutes: number;
  planId?: string;
}

export interface ConsentFlags {
  hrSharing: boolean;
  research: boolean;
  dataExport: boolean;
}

export interface PhysicalProfile {
  activityLevel: "sedentary" | "lightly_active" | "moderate" | "very_active";
  exerciseDaysPerWeek: number;
  pushUps: number;
  pullUps: number;
  squats: number;
  plankSeconds: number;
  burpees: number;
  dietType: "omnivore" | "vegetarian" | "vegan" | "keto" | "paleo";
  allergies: string[];
  waterGlassesPerDay: number;
  hasGymAccess: boolean;
  hasHomeEquipment: boolean;
  fitnessLevel?: "beginner" | "intermediate" | "advanced" | "expert";
  fitnessScore?: number;
}

export interface OnboardingState {
  orgCode?: string;
  orgName?: string;
  user?: UserProfile;
  authToken?: string;
  pillarScores?: { physical: number; mental: number; spiritual: number; lifestyle: number };
  consent?: ConsentFlags;
  physicalProfile?: PhysicalProfile;
  physicalQuestionnaireDone?: boolean;
  onboardingComplete?: boolean;
  // Extended fields for gym features
  lastGeneratedPlan?: any;
  lastNutritionPlan?: any;
  weightHistory?: WeightEntryLocal[];
  checkIns?: DailyCheckInLocal[];
  sessionLogs?: SessionLogRef[];
  streakDays?: number;
  totalWorkouts?: number;
  totalCaloriesBurned?: number;
  fitnessLevel?: "beginner" | "intermediate" | "advanced" | "expert";
  fitnessSublevel?: 1 | 2;
  // Mental wellness fields
  mentalBaseline?: MentalBaseline;
  mentalQuestionnaireDone?: boolean;
  mentalPlan?: MentalWellnessPlan;
  lastRppgScan?: RppgScanResult;
}

export async function getOnboardingState(): Promise<OnboardingState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as OnboardingState) : {};
  } catch {
    return {};
  }
}

export async function saveOnboardingState(
  partial: Partial<OnboardingState>,
): Promise<void> {
  try {
    const current = await getOnboardingState();
    const next = { ...current, ...partial };
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // silently fail in dev
  }
}

export async function clearOnboarding(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // no-op
  }
}

export async function saveAuthToken(token: string): Promise<void> {
  await saveOnboardingState({ authToken: token });
}

export async function getAuthToken(): Promise<string | null> {
  const state = await getOnboardingState();
  return state.authToken ?? null;
}

export async function clearAuthToken(): Promise<void> {
  await saveOnboardingState({ authToken: undefined });
}

/** Generate a simple unique user id */
export function generateUserId(): string {
  return (
    "u_" + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
  );
}

/** Known org referral codes — in production would be an API call */
export const VALID_ORG_CODES: Record<string, string> = {
  AURA2026: "Aura Health Co.",
  WELLORG: "WellOrg Inc.",
  DEMO: "Demo Organisation",
  TECHCORP: "TechCorp Wellness",
  STARTUP: "StartupHub",
};

// ── Weight History ──

export async function addWeightEntry(entry: WeightEntryLocal): Promise<void> {
  const state = await getOnboardingState();
  const history = state.weightHistory ?? [];
  history.push(entry);
  // Keep last 90 entries
  if (history.length > 90) history.splice(0, history.length - 90);
  await saveOnboardingState({ weightHistory: history });
}

export async function getWeightHistory(): Promise<WeightEntryLocal[]> {
  const state = await getOnboardingState();
  return state.weightHistory ?? [];
}

// ── Daily Check-In ──

export async function saveDailyCheckIn(checkIn: DailyCheckInLocal): Promise<void> {
  const state = await getOnboardingState();
  const checkIns = state.checkIns ?? [];
  // Replace if same date exists
  const idx = checkIns.findIndex((c) => c.dateIso === checkIn.dateIso);
  if (idx >= 0) checkIns[idx] = checkIn;
  else checkIns.push(checkIn);
  // Keep last 30
  if (checkIns.length > 30) checkIns.splice(0, checkIns.length - 30);
  await saveOnboardingState({ checkIns });
}

export async function getTodayCheckIn(): Promise<DailyCheckInLocal | null> {
  const state = await getOnboardingState();
  const today = new Date().toISOString().split("T")[0];
  return state.checkIns?.find((c) => c.dateIso === today) ?? null;
}

// ── Session Logs ──

export async function addSessionLog(log: SessionLogRef): Promise<void> {
  const state = await getOnboardingState();
  const logs = state.sessionLogs ?? [];
  logs.push(log);
  if (logs.length > 100) logs.splice(0, logs.length - 100);

  // Recalculate streak
  const streakDays = calculateStreak(logs);
  const totalWorkouts = (state.totalWorkouts ?? 0) + 1;
  const totalCaloriesBurned = (state.totalCaloriesBurned ?? 0) + log.caloriesBurned;

  await saveOnboardingState({ sessionLogs: logs, streakDays, totalWorkouts, totalCaloriesBurned });
}

export async function getSessionLogs(): Promise<SessionLogRef[]> {
  const state = await getOnboardingState();
  return state.sessionLogs ?? [];
}

function calculateStreak(logs: SessionLogRef[]): number {
  if (logs.length === 0) return 0;
  const uniqueDays = [...new Set(logs.map((l) => l.dateIso.split("T")[0]))].sort().reverse();
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < uniqueDays.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedIso = expected.toISOString().split("T")[0];
    if (uniqueDays[i] === expectedIso) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Calculate plan adherence as a 0-100% score.
 * Compares planned workout days (from plan schedule) vs actual session days this week.
 */
export function calculatePlanAdherence(
  logs: SessionLogRef[],
  plannedDays: string[],
): number {
  if (plannedDays.length === 0) return 100;

  // Get this week's dates (Mon-Sun)
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  // Session days this week
  const sessionDaysThisWeek = new Set(
    logs
      .filter((l) => {
        const d = new Date(l.dateIso);
        return d >= monday && d <= sunday;
      })
      .map((l) => l.day),
  );

  // Days up to today that were planned
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const todayName = dayNames[now.getDay()];
  const todayIdx = plannedDays.indexOf(todayName);
  const daysToCheck = todayIdx >= 0
    ? plannedDays.slice(0, todayIdx + 1)
    : plannedDays.filter((d) => {
        const di = dayNames.indexOf(d);
        const ti = dayNames.indexOf(todayName);
        // Compare within week order (mon=1 ... sun=0→7)
        const dOrd = di === 0 ? 7 : di;
        const tOrd = ti === 0 ? 7 : ti;
        return dOrd <= tOrd;
      });

  if (daysToCheck.length === 0) return 100;

  const completed = daysToCheck.filter((d) => sessionDaysThisWeek.has(d)).length;
  return Math.round((completed / daysToCheck.length) * 100);
}
