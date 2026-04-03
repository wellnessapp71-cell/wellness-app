/**
 * Auth token accessor — extracted to break the circular dependency
 * between user-store.ts and api.ts.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_AUTH = "@aura/auth";

export async function getAuthToken(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY_AUTH);
    if (!raw) return null;
    const auth = JSON.parse(raw);
    return auth?.token ?? null;
  } catch {
    return null;
  }
}
