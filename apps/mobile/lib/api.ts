import Constants from "expo-constants";
import { Platform } from "react-native";
import { getAuthToken } from "@/lib/auth-token";
import { emitUnauthorized } from "@/lib/auth-events";

function normalizeApiBaseUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

function isLocalOnlyHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "10.0.2.2" ||
    normalized.endsWith(".local") ||
    /^192\.168\./.test(normalized) ||
    /^10\./.test(normalized) ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(normalized)
  );
}

function validateConfiguredBaseUrl(configuredUrl: string): string {
  const normalized = normalizeApiBaseUrl(configuredUrl);
  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error("EXPO_PUBLIC_API_URL must be a valid absolute URL.");
  }

  if (!__DEV__ && isLocalOnlyHost(parsed.hostname)) {
    throw new Error(
      "EXPO_PUBLIC_API_URL points to a local/private host. Use a publicly reachable API URL for production builds.",
    );
  }

  return normalized;
}

function resolveApiBaseUrl(): string {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL;
  if (configuredUrl && configuredUrl.trim().length > 0) {
    return validateConfiguredBaseUrl(configuredUrl);
  }

  const hostUri =
    (Constants.expoConfig as { hostUri?: string } | null)?.hostUri ??
    (Constants as unknown as { manifest?: { debuggerHost?: string } }).manifest
      ?.debuggerHost ??
    (
      Constants as unknown as {
        manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } };
      }
    ).manifest2?.extra?.expoGo?.debuggerHost;

  // In local dev, fallback to Expo host or emulator-friendly defaults.
  if (__DEV__) {
    const host =
      hostUri?.split(":")[0] ??
      (Platform.OS === "android" ? "10.0.2.2" : "localhost");
    return `http://${host}:3000/api`;
  }

  // In non-dev contexts, require an explicit URL to avoid accidental localhost usage.
  throw new Error("EXPO_PUBLIC_API_URL is required outside local development.");
}

const API_BASE_URL = resolveApiBaseUrl();

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export class ApiRequestError extends Error {
  status?: number;
  code?: string;
  details?: unknown;

  constructor(
    message: string,
    options?: { status?: number; code?: string; details?: unknown },
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.status = options?.status;
    this.code = options?.code;
    this.details = options?.details;
  }
}

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
}

export const api = {
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${API_BASE_URL}${path}`;
    const authToken = await getAuthToken();
    const headers = {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options.headers,
    };

    const config: RequestInit = {
      method: options.method || "GET",
      headers,
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    let response: Response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30_000);
      response = await fetch(url, { ...config, signal: controller.signal });
      clearTimeout(timeoutId);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new Error("Request timed out after 30 seconds.");
      }
      throw new Error(
        "Network error. Verify backend is running and EXPO_PUBLIC_API_URL is configured.",
      );
    }

    const contentType = response.headers.get("content-type") || "";
    const raw = await response.text();

    let data: any = null;
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        if (contentType.includes("application/json")) {
          throw new Error("Invalid JSON response from API.");
        }
      }
    }

    if (response.status === 401) {
      emitUnauthorized();
      throw new ApiRequestError("Session expired. Please log in again.", {
        status: 401,
        code: "UNAUTHORIZED",
      });
    }

    if (!response.ok) {
      const statusMessage = `Request failed with status ${response.status}.`;
      throw new ApiRequestError(data?.error?.message || statusMessage, {
        status: response.status,
        code: data?.error?.code,
        details: data?.error?.details,
      });
    }

    if (!data || typeof data !== "object") {
      throw new Error("Invalid API response format.");
    }

    if (!data.ok) {
      throw new ApiRequestError(
        data.error?.message || "An API error occurred",
        {
          status: response.status,
          code: data.error?.code,
          details: data.error?.details,
        },
      );
    }

    return data.data;
  },

  get<T>(endpoint: string, headers?: Record<string, string>) {
    return this.request<T>(endpoint, { method: "GET", headers });
  },

  post<T>(endpoint: string, body: unknown, headers?: Record<string, string>) {
    return this.request<T>(endpoint, { method: "POST", body, headers });
  },
};
