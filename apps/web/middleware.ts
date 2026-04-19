import { NextRequest, NextResponse } from "next/server";

// ── CORS Configuration ──────────────────────────────────────────────────────
// Browser origins are restricted to an allowlist (comma-separated in env).
// The mobile app sends no Origin header, so those requests bypass CORS entirely.
const ALLOWED_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS";
const ALLOWED_HEADERS = "Content-Type, Authorization, X-Requested-With";
const MAX_AGE = "86400";

function parseAllowedOrigins(): string[] {
  const raw = process.env.ALLOWED_ORIGINS ?? "";
  const fromEnv = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (fromEnv.length > 0) return fromEnv;
  return ["http://localhost:3000", "http://127.0.0.1:3000"];
}

function corsHeaders(origin: string | null): Record<string, string> {
  // Native apps (Expo/React Native) don't send Origin — skip CORS entirely.
  if (!origin) return {};

  const allowed = parseAllowedOrigins();
  if (!allowed.includes(origin)) return {};

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Max-Age": MAX_AGE,
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
  };
}

// ── JWT helpers (edge-compatible — no Node-only imports) ─────────────────────
// We only need to decode & verify the signature on the edge.  The full
// `jsonwebtoken` package uses Node crypto and can't run on the Edge Runtime.
// Instead we do a lightweight HS256 verification using Web Crypto API.

async function verifyJwtEdge(
  token: string,
  secret: string,
): Promise<{ userId: string; email: string; role: string } | null> {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split(".");
    if (!headerB64 || !payloadB64 || !signatureB64) return null;

    // Verify signature using Web Crypto HS256
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );

    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const signatureBytes = base64UrlDecode(signatureB64);

    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes.buffer.slice(
        signatureBytes.byteOffset,
        signatureBytes.byteOffset + signatureBytes.byteLength,
      ) as ArrayBuffer,
      data,
    );
    if (!valid) return null;

    // Decode payload
    const payloadJson = new TextDecoder().decode(base64UrlDecode(payloadB64));
    const payload = JSON.parse(payloadJson) as Record<string, unknown>;

    // Check expiry
    if (typeof payload.exp === "number" && payload.exp < Date.now() / 1000) {
      return null;
    }

    if (
      typeof payload.userId === "string" &&
      typeof payload.email === "string" &&
      typeof payload.role === "string"
    ) {
      return {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      };
    }

    return null;
  } catch {
    return null;
  }
}

function base64UrlDecode(str: string): Uint8Array {
  // Convert base64url to base64
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  // Pad with '='
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ── Route-to-role mapping ────────────────────────────────────────────────────
const PROTECTED_ROUTES: Record<string, string[]> = {
  "/admin": ["admin"],
  "/hr": ["hr"],
  "/psychologist": ["psychologist"],
};

function getRequiredRoles(pathname: string): string[] | null {
  for (const [prefix, roles] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return roles;
    }
  }
  return null;
}

// ── Middleware ────────────────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get("origin");

  // ─── 1. CORS Preflight ───────────────────────────────────────────────────
  if (pathname.startsWith("/api/") && request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(origin),
    });
  }

  // ─── 2. CORS headers for all API responses ──────────────────────────────
  if (pathname.startsWith("/api/")) {
    const response = NextResponse.next();
    const headers = corsHeaders(origin);
    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value);
    }
    return response;
  }

  // ─── 3. Route protection for web portal pages ───────────────────────────
  const requiredRoles = getRequiredRoles(pathname);

  if (requiredRoles) {
    const token = request.cookies.get("aura-token")?.value;
    const jwtSecret = process.env.JWT_SECRET;

    if (!token || !jwtSecret) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifyJwtEdge(token, jwtSecret);

    if (!payload || !requiredRoles.includes(payload.role)) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// ── Matcher ──────────────────────────────────────────────────────────────────
// Only run middleware on API routes and protected portal paths.
// Exclude static files, _next internals, and public assets.
export const config = {
  matcher: [
    "/api/:path*",
    "/admin/:path*",
    "/admin",
    "/hr/:path*",
    "/hr",
    "/psychologist/:path*",
    "/psychologist",
  ],
};
