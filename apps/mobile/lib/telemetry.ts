import { AppState, Platform } from "react-native";
import Constants from "expo-constants";
import { api } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-token";

interface QueuedEvent {
  section: string;
  screen: string;
  action?: string;
  startTs: string;
  endTs?: string;
  durationSeconds?: number;
  device?: string;
  platform: string;
  source: "mobile";
  metadata?: Record<string, unknown>;
}

const MAX_QUEUE = 200;
const FLUSH_THRESHOLD = 20;

let queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let activeView: { section: string; screen: string; startedAt: number } | null = null;

function platformLabel(): string {
  return Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web";
}

function deviceName(): string | undefined {
  return Constants.deviceName ?? undefined;
}

function scheduleFlush(delayMs: number = 15_000): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushTelemetry();
  }, delayMs);
}

export async function flushTelemetry(): Promise<void> {
  if (queue.length === 0) return;
  const token = await getAuthToken();
  if (!token) return;
  const batch = queue.splice(0, queue.length);
  try {
    await api.post("/click-logs", { events: batch });
  } catch {
    // Push back onto queue to retry later; cap to avoid growth.
    queue = [...batch, ...queue].slice(0, MAX_QUEUE);
    scheduleFlush(60_000);
  }
}

export function trackScreen(section: string, screen: string, metadata?: Record<string, unknown>): void {
  flushActiveView();
  activeView = { section, screen, startedAt: Date.now() };
  queue.push({
    section,
    screen,
    action: "view",
    startTs: new Date().toISOString(),
    platform: platformLabel(),
    device: deviceName(),
    source: "mobile",
    metadata,
  });
  if (queue.length > MAX_QUEUE) queue = queue.slice(-MAX_QUEUE);
  if (queue.length >= FLUSH_THRESHOLD) void flushTelemetry();
  else scheduleFlush();
}

export function trackAction(
  section: string,
  screen: string,
  action: string,
  metadata?: Record<string, unknown>,
): void {
  queue.push({
    section,
    screen,
    action,
    startTs: new Date().toISOString(),
    platform: platformLabel(),
    device: deviceName(),
    source: "mobile",
    metadata,
  });
  if (queue.length > MAX_QUEUE) queue = queue.slice(-MAX_QUEUE);
  if (queue.length >= FLUSH_THRESHOLD) void flushTelemetry();
  else scheduleFlush();
}

function flushActiveView(): void {
  if (!activeView) return;
  const durationSeconds = Math.max(1, Math.round((Date.now() - activeView.startedAt) / 1000));
  queue.push({
    section: activeView.section,
    screen: activeView.screen,
    action: "leave",
    startTs: new Date(activeView.startedAt).toISOString(),
    endTs: new Date().toISOString(),
    durationSeconds,
    platform: platformLabel(),
    device: deviceName(),
    source: "mobile",
  });
  activeView = null;
}

export function initTelemetry(): () => void {
  const sub = AppState.addEventListener("change", (next) => {
    if (next === "background" || next === "inactive") {
      flushActiveView();
      void flushTelemetry();
    }
  });
  return () => sub.remove();
}
