import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: string;
}

const DEFAULT_JWT_EXPIRY: SignOptions["expiresIn"] =
  (process.env.JWT_EXPIRY ?? "7d") as SignOptions["expiresIn"];

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length < 32) {
    throw new Error("JWT_SECRET must be set with at least 32 characters.");
  }

  return secret;
}

export function signAuthToken(
  payload: AuthTokenPayload,
  expiresIn: SignOptions["expiresIn"] = DEFAULT_JWT_EXPIRY,
): string {
  return jwt.sign(payload, getJwtSecret(), {
    algorithm: "HS256",
    expiresIn,
  });
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS256"],
    });

    if (
      typeof decoded === "object" &&
      decoded !== null &&
      typeof decoded.userId === "string" &&
      typeof decoded.email === "string" &&
      typeof decoded.role === "string"
    ) {
      return {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function extractBearerToken(
  authorizationHeader: string | null,
): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");
  if (!scheme || !token) {
    return null;
  }

  return scheme.toLowerCase() === "bearer" ? token : null;
}
