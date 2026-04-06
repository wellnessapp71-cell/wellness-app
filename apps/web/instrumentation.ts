/**
 * Next.js instrumentation — runs once on server startup.
 * Validates environment variables and warns about insecure defaults.
 *
 * NOTE: This function is also called during `next build`.  We skip the
 * fatal guards at build time because environment variables may not be
 * available yet (Vercel injects runtime env vars separately).
 */
export function register() {
  const phase = process.env.NEXT_PHASE;
  const isBuildPhase = phase === "phase-production-build";

  // ── JWT_SECRET ──────────────────────────────────────────────────────────────
  const jwtSecret = process.env.JWT_SECRET ?? "";
  const isProduction = process.env.NODE_ENV === "production";

  if (!jwtSecret || jwtSecret.trim().length < 32) {
    const msg = "JWT_SECRET must be set with at least 32 characters.";
    if (isProduction && !isBuildPhase) {
      throw new Error(`[FATAL] ${msg} Refusing to start in production without a secure secret.`);
    }
    console.warn(`[AUTH WARNING] ${msg}`);
  }

  const KNOWN_WEAK_SECRETS = [
    "replace-with-a-random-64-char-secret",
    "local-dev-jwt-secret-change-me-1234567890abcd",
  ];
  if (isProduction && !isBuildPhase && KNOWN_WEAK_SECRETS.some((s) => jwtSecret.includes(s))) {
    throw new Error(
      "[FATAL] JWT_SECRET is set to a known default value. Generate a real secret before deploying: `openssl rand -base64 48`",
    );
  }

  // ── AUTH_COMPAT ─────────────────────────────────────────────────────────────
  const authCompat = process.env.AUTH_COMPAT;
  if (isProduction && !isBuildPhase && authCompat !== "false") {
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
