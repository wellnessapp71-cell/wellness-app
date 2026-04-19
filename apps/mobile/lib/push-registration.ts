import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "@/lib/api";

const STORED_TOKEN_KEY = "expo_push_token_v1";

async function ensureChannels(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("broadcast", {
    name: "Announcements",
    importance: Notifications.AndroidImportance.HIGH,
  });
  await Notifications.setNotificationChannelAsync("emergency", {
    name: "Emergency Alerts",
    importance: Notifications.AndroidImportance.MAX,
    bypassDnd: true,
    vibrationPattern: [0, 500, 250, 500],
  });
}

export async function registerPushToken(): Promise<string | null> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (status !== "granted") {
      const res = await Notifications.requestPermissionsAsync();
      status = res.status;
    }
    if (status !== "granted") return null;

    await ensureChannels();

    const projectId =
      (Constants.expoConfig as { extra?: { eas?: { projectId?: string } } } | null)?.extra?.eas
        ?.projectId ??
      (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId;

    const tokenRes = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenRes.data;
    if (!token) return null;

    const previous = await AsyncStorage.getItem(STORED_TOKEN_KEY);
    if (previous === token) return token;

    await api.post("/push-tokens", {
      token,
      platform: Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web",
      deviceName: Constants.deviceName ?? undefined,
      appVersion: (Constants.expoConfig as { version?: string } | null)?.version ?? undefined,
    });
    await AsyncStorage.setItem(STORED_TOKEN_KEY, token);
    return token;
  } catch {
    return null;
  }
}

export async function unregisterPushToken(): Promise<void> {
  const token = await AsyncStorage.getItem(STORED_TOKEN_KEY);
  if (!token) return;
  try {
    await api.request(`/push-tokens?token=${encodeURIComponent(token)}`, { method: "DELETE" });
  } catch {
    // Best effort.
  }
  await AsyncStorage.removeItem(STORED_TOKEN_KEY);
}
