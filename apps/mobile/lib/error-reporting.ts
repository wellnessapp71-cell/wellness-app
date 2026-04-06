/**
 * Lightweight error reporting helpers.
 * Wraps Sentry so the rest of the app doesn't need to import it directly.
 */
import * as Sentry from "@sentry/react-native";

/**
 * Report a non-fatal error to Sentry with context.
 * Use for unexpected failures in critical paths (onboarding, data submission, etc.).
 */
export function captureError(error: unknown, context?: Record<string, unknown>): void {
  const err = error instanceof Error ? error : new Error(String(error));
  Sentry.captureException(err, { extra: context });
}

/**
 * Record a breadcrumb for expected/tolerated failures (offline sync, engine fallback).
 * These don't create Sentry issues but appear in the trail if a later crash occurs.
 */
export function recordFailedSync(operation: string, error?: unknown): void {
  Sentry.addBreadcrumb({
    category: "sync",
    message: `Offline-first fallback: ${operation}`,
    level: "warning",
    data: error instanceof Error ? { message: error.message } : undefined,
  });
}
