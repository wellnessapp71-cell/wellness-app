import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "@/lib/api";

const STORAGE_KEY = "feature_flags_v1";

interface FlagsPayload {
  flags: Record<string, boolean>;
  organizationId: string | null;
  fetchedAt: number;
}

let cache: FlagsPayload | null = null;

export async function loadCachedFlags(): Promise<FlagsPayload | null> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    cache = JSON.parse(raw);
    return cache;
  } catch {
    return null;
  }
}

export async function refreshFlags(): Promise<FlagsPayload | null> {
  try {
    const data = await api.get<{ flags: Record<string, boolean>; organizationId: string | null }>(
      "/feature-flags",
    );
    const payload: FlagsPayload = { ...data, fetchedAt: Date.now() };
    cache = payload;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return payload;
  } catch {
    return loadCachedFlags();
  }
}

export function isEnabled(flagKey: string, fallback = true): boolean {
  if (!cache) return fallback;
  const val = cache.flags[flagKey];
  return val === undefined ? fallback : val;
}

export async function clearFlags(): Promise<void> {
  cache = null;
  await AsyncStorage.removeItem(STORAGE_KEY);
}
