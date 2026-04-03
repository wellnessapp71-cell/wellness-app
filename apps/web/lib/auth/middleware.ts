import { NextRequest } from "next/server";
import { extractBearerToken, verifyAuthToken } from "@/lib/auth/jwt";

export interface AuthContext {
  userId: string;
  email: string;
  role: string;
  isLegacy: boolean;
}

interface ResolveAuthContextOptions {
  legacyUserId?: string | null;
  allowAnonymousWhenCompat?: boolean;
}

export function isAuthCompatibilityModeEnabled(): boolean {
  return process.env.AUTH_COMPAT !== "false";
}

export function resolveAuthContext(
  request: Request,
  options: ResolveAuthContextOptions = {},
): AuthContext | null {
  const token = extractBearerToken(request.headers.get("authorization"));
  if (token) {
    const payload = verifyAuthToken(token);
    if (payload) {
      return {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        isLegacy: false,
      };
    }

    // Do not downgrade to legacy auth when a token is provided but invalid.
    return null;
  }

  if (!isAuthCompatibilityModeEnabled()) {
    return null;
  }

  if (options.legacyUserId && options.legacyUserId.trim().length > 0) {
    return {
      userId: options.legacyUserId,
      email: "legacy@local",
      role: "legacy",
      isLegacy: true,
    };
  }

  if (options.allowAnonymousWhenCompat) {
    return {
      userId: "legacy-anonymous",
      email: "legacy@local",
      role: "legacy",
      isLegacy: true,
    };
  }

  return null;
}

export function resolveAuthContextFromNextRequest(
  request: NextRequest,
): AuthContext | null {
  const legacyUserId = request.nextUrl.searchParams.get("userId");
  return resolveAuthContext(request, { legacyUserId });
}
