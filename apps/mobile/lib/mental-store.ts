/**
 * Mental wellness local storage — AsyncStorage-backed, offline-first.
 * Key: @aura/mental
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  MentalBaseline,
  MentalDailyCheckIn,
  RppgScanResult,
  MentalJournalEntry,
  CopingSession,
  SupportRequest,
  WeeklyReviewData,
  ContentProgressEntry,
  CommunityPost,
  ChatRoom,
  MentalWellnessPlan,
} from "@aura/types";

const KEY = "@aura/mental";

interface MentalState {
  baseline?: MentalBaseline;
  checkIns?: MentalDailyCheckIn[];
  rppgScans?: RppgScanResult[];
  journalEntries?: MentalJournalEntry[];
  copingSessions?: CopingSession[];
  supportRequests?: SupportRequest[];
  weeklyReviews?: WeeklyReviewData[];
  contentProgress?: ContentProgressEntry[];
  chatRooms?: ChatRoom[];
  communityPosts?: CommunityPost[];
  blockedUsers?: string[];
  mentalPlan?: MentalWellnessPlan;
}

async function getState(): Promise<MentalState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MentalState) : {};
  } catch {
    return {};
  }
}

async function setState(partial: Partial<MentalState>): Promise<void> {
  try {
    const current = await getState();
    await AsyncStorage.setItem(KEY, JSON.stringify({ ...current, ...partial }));
  } catch {
    // silently fail in dev
  }
}

// ── Baseline ─────────────────────────────────────────────────────────────────

export async function saveMentalBaseline(baseline: MentalBaseline): Promise<void> {
  await setState({ baseline });
}

export async function getMentalBaseline(): Promise<MentalBaseline | null> {
  const state = await getState();
  return state.baseline ?? null;
}

// ── Check-ins ─────────────────────────────────────────────────────────────────

export async function saveMentalCheckIn(checkIn: MentalDailyCheckIn): Promise<void> {
  const state = await getState();
  const checkIns = state.checkIns ?? [];
  const idx = checkIns.findIndex((c) => c.dateIso === checkIn.dateIso);
  if (idx >= 0) checkIns[idx] = checkIn;
  else checkIns.push(checkIn);
  // Keep last 30 days
  if (checkIns.length > 30) checkIns.splice(0, checkIns.length - 30);
  await setState({ checkIns });
}

export async function getTodayMentalCheckIn(): Promise<MentalDailyCheckIn | null> {
  const state = await getState();
  const today = new Date().toISOString().split("T")[0];
  return state.checkIns?.find((c) => c.dateIso === today) ?? null;
}

export async function getMentalCheckInHistory(days = 30): Promise<MentalDailyCheckIn[]> {
  const state = await getState();
  const all = state.checkIns ?? [];
  if (days >= 30) return all;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffIso = cutoff.toISOString().split("T")[0];
  return all.filter((c) => c.dateIso >= cutoffIso);
}

// ── rPPG Scans ────────────────────────────────────────────────────────────────

export async function saveRppgScan(scan: RppgScanResult): Promise<void> {
  const state = await getState();
  const scans = state.rppgScans ?? [];
  scans.push(scan);
  // Keep last 50 scans
  if (scans.length > 50) scans.splice(0, scans.length - 50);
  await setState({ rppgScans: scans });
}

export async function getLatestRppgScan(): Promise<RppgScanResult | null> {
  const state = await getState();
  const scans = state.rppgScans ?? [];
  return scans.length > 0 ? scans[scans.length - 1] : null;
}

export async function getRppgHistory(): Promise<RppgScanResult[]> {
  const state = await getState();
  return state.rppgScans ?? [];
}

// ── Journal ───────────────────────────────────────────────────────────────────

export async function saveJournalEntry(entry: MentalJournalEntry): Promise<void> {
  const state = await getState();
  const entries = state.journalEntries ?? [];
  const idx = entries.findIndex((e) => e.entryId === entry.entryId);
  if (idx >= 0) entries[idx] = entry;
  else entries.push(entry);
  // Keep last 200 entries
  if (entries.length > 200) entries.splice(0, entries.length - 200);
  await setState({ journalEntries: entries });
}

export async function getJournalEntries(): Promise<MentalJournalEntry[]> {
  const state = await getState();
  return (state.journalEntries ?? []).slice().reverse(); // newest first
}

export async function deleteJournalEntry(entryId: string): Promise<void> {
  const state = await getState();
  const entries = (state.journalEntries ?? []).filter((e) => e.entryId !== entryId);
  await setState({ journalEntries: entries });
}

// ── Coping Sessions ───────────────────────────────────────────────────────────

export async function saveCopingSession(session: CopingSession): Promise<void> {
  const state = await getState();
  const sessions = state.copingSessions ?? [];
  sessions.push(session);
  // Keep last 100 sessions
  if (sessions.length > 100) sessions.splice(0, sessions.length - 100);
  await setState({ copingSessions: sessions });
}

export async function getCopingSessions(): Promise<CopingSession[]> {
  const state = await getState();
  return state.copingSessions ?? [];
}

// ── Support Requests ──────────────────────────────────────────────────────────

export async function saveSupportRequest(request: SupportRequest): Promise<void> {
  const state = await getState();
  const requests = state.supportRequests ?? [];
  const idx = requests.findIndex((r) => r.requestId === request.requestId);
  if (idx >= 0) requests[idx] = request;
  else requests.push(request);
  await setState({ supportRequests: requests });
}

export async function getSupportRequests(): Promise<SupportRequest[]> {
  const state = await getState();
  return state.supportRequests ?? [];
}

// ── Weekly Reviews ────────────────────────────────────────────────────────────

export async function saveWeeklyReview(review: WeeklyReviewData): Promise<void> {
  const state = await getState();
  const reviews = state.weeklyReviews ?? [];
  reviews.push(review);
  // Keep last 12 weeks
  if (reviews.length > 12) reviews.splice(0, reviews.length - 12);
  await setState({ weeklyReviews: reviews });
}

export async function getLatestWeeklyReview(): Promise<WeeklyReviewData | null> {
  const state = await getState();
  const reviews = state.weeklyReviews ?? [];
  return reviews.length > 0 ? reviews[reviews.length - 1] : null;
}

// ── Content Progress ──────────────────────────────────────────────────────────

export async function saveContentProgress(moduleId: string, percent: number): Promise<void> {
  const state = await getState();
  const progress = state.contentProgress ?? [];
  const now = new Date().toISOString();
  const idx = progress.findIndex((p) => p.moduleId === moduleId);
  const entry: ContentProgressEntry = { userId: "", moduleId, progressPercent: percent, updatedAtIso: now };
  if (idx >= 0) progress[idx] = entry;
  else progress.push(entry);
  await setState({ contentProgress: progress });
}

export async function getContentProgress(): Promise<Record<string, number>> {
  const state = await getState();
  const progress = state.contentProgress ?? [];
  return Object.fromEntries(progress.map((p) => [p.moduleId, p.progressPercent]));
}

// ── Chatrooms (local-first) ──────────────────────────────────────────────────

export async function saveChatRoom(room: ChatRoom): Promise<void> {
  const state = await getState();
  const rooms = state.chatRooms ?? [];
  const idx = rooms.findIndex((r) => r.roomId === room.roomId);
  if (idx >= 0) rooms[idx] = room;
  else rooms.push(room);
  await setState({ chatRooms: rooms });
}

export async function getChatRooms(): Promise<ChatRoom[]> {
  const state = await getState();
  return (state.chatRooms ?? []).sort(
    (a, b) => new Date(b.lastActivityIso).getTime() - new Date(a.lastActivityIso).getTime(),
  );
}

export async function getChatRoom(roomId: string): Promise<ChatRoom | null> {
  const state = await getState();
  return (state.chatRooms ?? []).find((r) => r.roomId === roomId) ?? null;
}

export async function searchChatRooms(query: string, userId: string): Promise<ChatRoom[]> {
  const state = await getState();
  const rooms = state.chatRooms ?? [];
  const q = query.toLowerCase().trim();
  if (!q) return rooms.filter((r) => r.visibility === "public" || r.invitedUserIds.includes(userId) || r.createdBy === userId);
  return rooms.filter((r) => {
    const visible = r.visibility === "public" || r.invitedUserIds.includes(userId) || r.createdBy === userId;
    if (!visible) return false;
    return (
      r.name.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.keywords.some((k) => k.toLowerCase().includes(q))
    );
  });
}

export async function deleteChatRoom(roomId: string): Promise<void> {
  const state = await getState();
  const rooms = (state.chatRooms ?? []).filter((r) => r.roomId !== roomId);
  const posts = (state.communityPosts ?? []).filter((p) => p.roomId !== roomId);
  await setState({ chatRooms: rooms, communityPosts: posts });
}

export async function inviteToRoom(roomId: string, userIds: string[]): Promise<void> {
  const state = await getState();
  const rooms = state.chatRooms ?? [];
  const idx = rooms.findIndex((r) => r.roomId === roomId);
  if (idx >= 0) {
    const existing = new Set(rooms[idx].invitedUserIds);
    for (const id of userIds) existing.add(id);
    rooms[idx] = { ...rooms[idx], invitedUserIds: Array.from(existing) };
    await setState({ chatRooms: rooms });
  }
}

// ── Community Posts (local-first) ────────────────────────────────────────────

export async function saveCommunityPost(post: CommunityPost): Promise<void> {
  const state = await getState();
  const posts = state.communityPosts ?? [];
  const idx = posts.findIndex((p) => p.postId === post.postId);
  if (idx >= 0) posts[idx] = post;
  else posts.push(post);
  if (posts.length > 500) posts.splice(0, posts.length - 500);

  // Update room's lastActivityIso
  const rooms = state.chatRooms ?? [];
  const roomIdx = rooms.findIndex((r) => r.roomId === post.roomId);
  if (roomIdx >= 0) {
    rooms[roomIdx] = { ...rooms[roomIdx], lastActivityIso: post.createdAtIso };
  }

  await setState({ communityPosts: posts, chatRooms: rooms });
}

export async function getCommunityPosts(roomId: string): Promise<CommunityPost[]> {
  const state = await getState();
  const blocked = state.blockedUsers ?? [];
  return (state.communityPosts ?? []).filter(
    (p) => p.roomId === roomId && !p.isHidden && !blocked.includes(p.authorId),
  );
}

export async function getPostCountForRoom(roomId: string): Promise<number> {
  const posts = await getCommunityPosts(roomId);
  return posts.length;
}

export async function reportPost(postId: string): Promise<void> {
  const state = await getState();
  const posts = state.communityPosts ?? [];
  const idx = posts.findIndex((p) => p.postId === postId);
  if (idx >= 0) {
    const newCount = posts[idx].reportCount + 1;
    posts[idx] = {
      ...posts[idx],
      reportCount: newCount,
      isHidden: newCount >= 3 ? true : posts[idx].isHidden,
    };
    await setState({ communityPosts: posts });
  }
}

export async function blockUser(userId: string): Promise<void> {
  const state = await getState();
  const blocked = state.blockedUsers ?? [];
  if (!blocked.includes(userId)) {
    await setState({ blockedUsers: [...blocked, userId] });
  }
}

// ── Mental Plan ───────────────────────────────────────────────────────────────

export async function saveMentalPlan(plan: MentalWellnessPlan): Promise<void> {
  await setState({ mentalPlan: plan });
}

export async function getCurrentMentalPlan(): Promise<MentalWellnessPlan | null> {
  const state = await getState();
  return state.mentalPlan ?? null;
}

// ── Utilities ─────────────────────────────────────────────────────────────────

export async function clearMentalData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // no-op
  }
}
