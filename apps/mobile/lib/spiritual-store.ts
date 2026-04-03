/**
 * Spiritual wellness local storage — AsyncStorage-backed, offline-first.
 * Key: @aura/spiritual
 *
 * Mirrors mental-store.ts pattern exactly.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  SpiritualBaseline,
  SpiritualDailyCheckIn,
  SpiritualPracticeSession,
  SpiritualJournalEntry,
  SpiritualWeeklyReview,
  SpiritualWellnessPlan,
} from "@aura/types";

const KEY = "@aura/spiritual";

interface SpiritualState {
  baseline?: SpiritualBaseline;
  checkIns?: SpiritualDailyCheckIn[];
  practiceSessions?: SpiritualPracticeSession[];
  journalEntries?: SpiritualJournalEntry[];
  weeklyReviews?: SpiritualWeeklyReview[];
  plan?: SpiritualWellnessPlan;
  contentProgress?: Record<string, number>;
}

async function getState(): Promise<SpiritualState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SpiritualState) : {};
  } catch {
    return {};
  }
}

async function setState(partial: Partial<SpiritualState>): Promise<void> {
  try {
    const current = await getState();
    await AsyncStorage.setItem(KEY, JSON.stringify({ ...current, ...partial }));
  } catch {
    // silently fail in dev
  }
}

// ── Baseline ─────────────────────────────────────────────────────────────────

export async function saveSpiritualBaseline(baseline: SpiritualBaseline): Promise<void> {
  await setState({ baseline });
}

export async function getSpiritualBaseline(): Promise<SpiritualBaseline | null> {
  const state = await getState();
  return state.baseline ?? null;
}

// ── Check-ins ─────────────────────────────────────────────────────────────────

export async function saveSpiritualCheckIn(checkIn: SpiritualDailyCheckIn): Promise<void> {
  const state = await getState();
  const checkIns = state.checkIns ?? [];
  const idx = checkIns.findIndex((c) => c.date === checkIn.date);
  if (idx >= 0) checkIns[idx] = checkIn;
  else checkIns.push(checkIn);
  // Keep last 30 days
  if (checkIns.length > 30) checkIns.splice(0, checkIns.length - 30);
  await setState({ checkIns });
}

export async function getTodaySpiritualCheckIn(): Promise<SpiritualDailyCheckIn | null> {
  const state = await getState();
  const today = new Date().toISOString().split("T")[0];
  return state.checkIns?.find((c) => c.date === today) ?? null;
}

export async function getSpiritualCheckInHistory(days = 30): Promise<SpiritualDailyCheckIn[]> {
  const state = await getState();
  const all = state.checkIns ?? [];
  if (days >= 30) return all;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffDate = cutoff.toISOString().split("T")[0];
  return all.filter((c) => c.date >= cutoffDate);
}

// ── Practice Sessions ─────────────────────────────────────────────────────────

export async function savePracticeSession(session: SpiritualPracticeSession): Promise<void> {
  const state = await getState();
  const sessions = state.practiceSessions ?? [];
  sessions.push(session);
  // Keep last 100 sessions
  if (sessions.length > 100) sessions.splice(0, sessions.length - 100);
  await setState({ practiceSessions: sessions });
}

export async function getPracticeSessions(): Promise<SpiritualPracticeSession[]> {
  const state = await getState();
  return state.practiceSessions ?? [];
}

// ── Journal ───────────────────────────────────────────────────────────────────

export async function saveSpiritualJournal(entry: SpiritualJournalEntry): Promise<void> {
  const state = await getState();
  const entries = state.journalEntries ?? [];
  const idx = entries.findIndex((e) => e.id === entry.id);
  if (idx >= 0) entries[idx] = entry;
  else entries.push(entry);
  // Keep last 200 entries
  if (entries.length > 200) entries.splice(0, entries.length - 200);
  await setState({ journalEntries: entries });
}

export async function getSpiritualJournals(): Promise<SpiritualJournalEntry[]> {
  const state = await getState();
  return (state.journalEntries ?? []).slice().reverse(); // newest first
}

export async function deleteSpiritualJournal(id: string): Promise<void> {
  const state = await getState();
  const entries = (state.journalEntries ?? []).filter((e) => e.id !== id);
  await setState({ journalEntries: entries });
}

// ── Weekly Reviews ────────────────────────────────────────────────────────────

export async function saveSpiritualWeeklyReview(review: SpiritualWeeklyReview): Promise<void> {
  const state = await getState();
  const reviews = state.weeklyReviews ?? [];
  reviews.push(review);
  // Keep last 12 weeks
  if (reviews.length > 12) reviews.splice(0, reviews.length - 12);
  await setState({ weeklyReviews: reviews });
}

export async function getLatestSpiritualWeeklyReview(): Promise<SpiritualWeeklyReview | null> {
  const state = await getState();
  const reviews = state.weeklyReviews ?? [];
  return reviews.length > 0 ? reviews[reviews.length - 1] : null;
}

// ── Plan ──────────────────────────────────────────────────────────────────────

export async function saveSpiritualPlan(plan: SpiritualWellnessPlan): Promise<void> {
  await setState({ plan });
}

export async function getCurrentSpiritualPlan(): Promise<SpiritualWellnessPlan | null> {
  const state = await getState();
  return state.plan ?? null;
}

// ── Content Progress ──────────────────────────────────────────────────────────

export async function saveSpiritualContentProgress(
  moduleId: string,
  percent: number
): Promise<void> {
  const state = await getState();
  const progress = state.contentProgress ?? {};
  progress[moduleId] = percent;
  await setState({ contentProgress: progress });
}

export async function getSpiritualContentProgress(): Promise<Record<string, number>> {
  const state = await getState();
  return state.contentProgress ?? {};
}

// ── Utilities ─────────────────────────────────────────────────────────────────

export async function clearSpiritualData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // no-op
  }
}
