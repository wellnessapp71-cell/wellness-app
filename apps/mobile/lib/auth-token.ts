/**
 * Auth token accessor — uses expo-secure-store for encrypted storage
 * on native devices, with AsyncStorage fallback for web.
 */
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SECURE_KEY = "aura_auth_token";
const LEGACY_KEY = "@aura/auth";

async function isSecureStoreAvailable(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  return SecureStore.isAvailableAsync();
}

export async function getAuthToken(): Promise<string | null> {
  try {
    if (await isSecureStoreAvailable()) {
      const token = await SecureStore.getItemAsync(SECURE_KEY);
      if (token) return token;

      // Migrate from legacy AsyncStorage if token exists there
      const raw = await AsyncStorage.getItem(LEGACY_KEY);
      if (raw) {
        const auth = JSON.parse(raw);
        const legacyToken = auth?.token ?? null;
        if (legacyToken) {
          await SecureStore.setItemAsync(SECURE_KEY, legacyToken);
          return legacyToken;
        }
      }
      return null;
    }

    // Fallback for web
    const raw = await AsyncStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const auth = JSON.parse(raw);
    return auth?.token ?? null;
  } catch {
    return null;
  }
}

export async function saveAuthToken(token: string): Promise<void> {
  if (await isSecureStoreAvailable()) {
    await SecureStore.setItemAsync(SECURE_KEY, token);
  }
  // AsyncStorage still stores the full auth state (sans token on native)
  // for non-sensitive fields — handled by user-store.ts
}

export async function clearAuthToken(): Promise<void> {
  try {
    if (await isSecureStoreAvailable()) {
      await SecureStore.deleteItemAsync(SECURE_KEY);
    }
  } catch {
    // no-op
  }
}
