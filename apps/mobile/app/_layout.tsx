import "../global.css";
import { Stack, useRouter, useNavigationContainerRef } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Alert } from "react-native";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { onUnauthorized } from "@/lib/auth-events";
import { clearAuth } from "@/lib/user-store";
import { Sentry, initSentry, navigationIntegration } from "@/lib/sentry";

initSentry();

function RootNavigation() {
  const router = useRouter();
  const ref = useNavigationContainerRef();

  useEffect(() => {
    if (ref) {
      navigationIntegration.registerNavigationContainer(ref);
    }
  }, [ref]);

  useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      clearAuth().then(() => {
        Alert.alert(
          "Session Expired",
          "Please log in again.",
          [{ text: "OK", onPress: () => router.replace("/onboarding/login") }],
        );
      });
    });
    return unsubscribe;
  }, [router]);

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
