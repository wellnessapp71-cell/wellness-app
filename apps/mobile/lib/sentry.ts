import * as Sentry from "@sentry/react-native";
import { isRunningInExpoGo } from "expo";
import Constants from "expo-constants";

const SENTRY_DSN = (
  process.env.EXPO_PUBLIC_SENTRY_DSN ??
  process.env.SENTRY_DSN ??
  ""
).trim();

export const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: !isRunningInExpoGo(),
});

export function initSentry() {
  const enabled = SENTRY_DSN.length > 0;

  if (!enabled && __DEV__) {
    console.log(
      "[Sentry] No DSN configured — crash reporting disabled in dev.",
    );
  }

  Sentry.init({
    dsn: SENTRY_DSN || undefined,
    enabled,
    sendDefaultPii: true,
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    profilesSampleRate: __DEV__ ? 1.0 : 0.1,
    integrations: [navigationIntegration],
    enableNativeFramesTracking: !isRunningInExpoGo(),
    environment: __DEV__ ? "development" : "production",
    release: Constants.expoConfig?.version ?? "1.0.0",
    beforeSend(event) {
      // Strip sensitive data from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((b) => {
          if (b.category === "fetch" && b.data?.url) {
            // Don't send auth tokens in breadcrumb URLs
            const url = String(b.data.url);
            if (url.includes("token=") || url.includes("authorization")) {
              b.data.url = url.replace(/token=[^&]+/, "token=[REDACTED]");
            }
          }
          return b;
        });
      }
      return event;
    },
  });
}

export { Sentry };
