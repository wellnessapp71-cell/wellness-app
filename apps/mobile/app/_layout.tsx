import "../global.css";
import { Stack, useRouter, useNavigationContainerRef, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Alert } from "react-native";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { onUnauthorized } from "@/lib/auth-events";
import { clearAuth } from "@/lib/user-store";
import { Sentry, initSentry, navigationIntegration } from "@/lib/sentry";
import { loadCachedFlags, refreshFlags, clearFlags } from "@/lib/feature-flags";
import { registerPushToken } from "@/lib/push-registration";
import { getAuthToken } from "@/lib/auth-token";
import { initTelemetry, trackScreen, flushTelemetry } from "@/lib/telemetry";

initSentry();

function RootNavigation() {
  const router = useRouter();
  const ref = useNavigationContainerRef();
  const segments = useSegments();

  useEffect(() => {
    if (ref) {
      navigationIntegration.registerNavigationContainer(ref);
    }
  }, [ref]);

  useEffect(() => {
    const parts = segments.filter((s) => !s.startsWith("("));
    const section = parts[0] || "home";
    const screen = parts.slice(1).join("/") || "index";
    trackScreen(section, screen);
  }, [segments]);

  useEffect(() => {
    const disposeTelemetry = initTelemetry();
    return () => {
      disposeTelemetry();
      void flushTelemetry();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      clearAuth().then(() => {
        clearFlags();
        Alert.alert(
          "Session Expired",
          "Please log in again.",
          [{ text: "OK", onPress: () => router.replace("/onboarding/login") }],
        );
      });
    });
    return unsubscribe;
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadCachedFlags();
      const token = await getAuthToken();
      if (cancelled || !token) return;
      await refreshFlags();
      await registerPushToken();
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="physical" />
        <Stack.Screen name="mental" />
        <Stack.Screen name="spiritual" />
        <Stack.Screen name="lifestyle" />
        <Stack.Screen name="admin" options={{ presentation: "modal" }} />
        <Stack.Screen name="stress-scan" options={{ presentation: "fullScreenModal" }} />
        <Stack.Screen name="support" options={{ presentation: "modal" }} />
        <Stack.Screen name="settings" />
      </Stack>
    </>
  );
}

function RootLayout() {
  return (
    <ErrorBoundary>
      <RootNavigation />
    </ErrorBoundary>
  );
}

export default Sentry.wrap(RootLayout);
