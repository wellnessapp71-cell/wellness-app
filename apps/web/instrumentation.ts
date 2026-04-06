/**
 * Next.js instrumentation — runs once on server startup.
 * Validates environment variables and warns about insecure defaults.
 */
export function register() {
  // ── JWT_SECRET ──────────────────────────────────────────────────────────────
  const jwtSecret = process.env.JWT_SECRET ?? "";
  const isProduction = process.env.NODE_ENV === "production";

  if (!jwtSecret || jwtSecret.trim().length < 32) {
    const msg = "JWT_SECRET must be set with at least 32 characters.";
    if (isProduction) {
      throw new Error(`[FATAL] ${msg} Refusing to start in production without a secure secret.`);
    }
    console.warn(`[AUTH WARNING] ${msg}`);
  }

  const KNOWN_WEAK_SECRETS = [
    "replace-with-a-random-64-char-secret",
    "local-dev-jwt-secret-change-me-1234567890abcd",
  ];
  if (isProduction && KNOWN_WEAK_SECRETS.some((s) => jwtSecret.includes(s))) {
    throw new Error(
      "[FATAL] JWT_SECRET is set to a known default value. Generate a real secret before deploying: `openssl rand -base64 48`",
    );
  }

  // ── AUTH_COMPAT ─────────────────────────────────────────────────────────────
  const authCompat = process.env.AUTH_COMPAT;
  if (isProduction && authCompat !== "false") {
    throw new Error(
      "[FATAL] AUTH_COMPAT must be set to 'false' in production. Legacy userId fallback is not safe for public deployment.",
    );
  }
  if (authCompat !== "false") {
    console.warn(
      "[AUTH WARNING] AUTH_COMPAT is enabled — legacy userId fallback is active. Set AUTH_COMPAT=false before deploying.",
    );
  }
}
