/**
 * In-memory sliding-window rate limiter.
 *
 * Each serverless function instance keeps its own map, so limits are
 * per-instance rather than globally distributed.  This is fine for
 * launch-scale traffic.  For true global limiting swap to Upstash Redis.
 */

interface RateLimitEntry {
  timestamps: number[];
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  /** Milliseconds until the oldest request in the window expires. */
  resetMs: number;
}

interface RateLimiterOptions {
  /** Window size in milliseconds. */
  windowMs: number;
  /** Maximum requests allowed within the window. */
  maxRequests: number;
}

const store = new Map<string, RateLimitEntry>();

// Periodically purge stale entries so the map doesn't grow forever.
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

export function rateLimit(
  key: string,
  options: RateLimiterOptions,
): RateLimitResult {
  const { windowMs, maxRequests } = options;
  const now = Date.now();

  cleanup(windowMs);

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Drop timestamps outside the current window.
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= maxRequests) {
    const oldest = entry.timestamps[0]!;
    return {
      success: false,
      remaining: 0,
      resetMs: windowMs - (now - oldest),
    };
  }

  entry.timestamps.push(now);

  return {
    success: true,
    remaining: maxRequests - entry.timestamps.length,
    resetMs: windowMs,
  };
}

/**
 * Extract a reasonable client identifier from the request.
 * On Vercel the real IP is in `x-forwarded-for`; fall back to
 * `x-real-ip` or a constant for local dev.
 */
export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "127.0.0.1";
}
