import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="physical" />
        <Stack.Screen name="mental" />
        <Stack.Screen name="admin" options={{ presentation: "modal" }} />
        <Stack.Screen name="stress-scan" options={{ presentation: "fullScreenModal" }} />
      </Stack>
    </>
  );
}
