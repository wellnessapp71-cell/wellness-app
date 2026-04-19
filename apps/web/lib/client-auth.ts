"use client";

export interface StoredAuthUser {
  userId: string;
  email: string;
  username: string;
  name: string | null;
  referralCode: string;
  role: string;
  token: string;
  organization?: {
    id: string;
    name: string;
    referralCode: string;
  } | null;
}

const AUTH_STORAGE_KEY = "aura-web-auth";

export function getStoredAuth(): StoredAuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    const normalized = normalizeStoredAuth(parsed);
    if (!normalized) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    return normalized;
  } catch {
    return null;
  }
}

export function setStoredAuth(auth: StoredAuthUser) {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = normalizeStoredAuth(auth);
  if (!normalized) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    clearAuthCookie();
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalized));
  setAuthCookie(normalized.token);
}

export function clearStoredAuth() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  clearAuthCookie();
}

// ── Cookie helpers (for server-side middleware route protection) ──────────

const AUTH_COOKIE_NAME = "aura-token";
const COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days (matches JWT_EXPIRY)

function setAuthCookie(token: string) {
  document.cookie = `${AUTH_COOKIE_NAME}=${token}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

function clearAuthCookie() {
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

export async function fetchWithAuth<T>(path: string, init: RequestInit = {}) {
  const auth = getStoredAuth();
  if (!auth?.token) {
    throw new Error("Missing auth token.");
  }

  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
      Authorization: `Bearer ${auth.token}`,
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? payload?.message ?? "Request failed.");
  }

  return unwrapApiData(payload) as T;
}

export function getDashboardRoute(role: string) {
  switch (role) {
    case "admin":
      return "/admin";
    case "hr":
      return "/hr";
    case "psychologist":
      return "/psychologist";
    case "employee":
      return "/app";
    default:
      return "/";
  }
}

function unwrapApiData(payload: unknown): unknown {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "ok" in payload &&
    "data" in payload &&
    (payload as { ok?: unknown }).ok === true
  ) {
    return (payload as { data: unknown }).data;
  }

  return payload;
}

function normalizeStoredAuth(payload: unknown): StoredAuthUser | null {
  const value = unwrapApiData(payload);

  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.userId !== "string" ||
    typeof candidate.email !== "string" ||
    typeof candidate.username !== "string" ||
    typeof candidate.referralCode !== "string" ||
    typeof candidate.role !== "string" ||
    typeof candidate.token !== "string"
  ) {
    return null;
  }

  return {
    userId: candidate.userId,
    email: candidate.email,
    username: candidate.username,
    name: typeof candidate.name === "string" || candidate.name === null ? candidate.name : null,
    referralCode: candidate.referralCode,
    role: candidate.role,
    token: candidate.token,
    organization:
      typeof candidate.organization === "object" && candidate.organization !== null
        ? {
            id: String((candidate.organization as Record<string, unknown>).id ?? ""),
            name: String((candidate.organization as Record<string, unknown>).name ?? ""),
            referralCode: String((candidate.organization as Record<string, unknown>).referralCode ?? ""),
          }
        : null,
  };
}
