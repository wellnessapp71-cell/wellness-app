/**
 * GET /api/health — Liveness + readiness probe.
 *
 * Returns 200 when the DB is reachable and required env is present, 503 otherwise.
 * Used by uptime monitors and platform health checks.
 */

import { prisma } from "@aura/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(): Promise<NextResponse> {
  const startedAt = Date.now();
  const checks: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {};

  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { ok: true, latencyMs: Date.now() - dbStart };
  } catch (err) {
    checks.database = {
      ok: false,
      latencyMs: Date.now() - dbStart,
      error: err instanceof Error ? err.message : "Unknown DB error",
    };
  }

  const env = {
    jwt: !!process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32,
    database: !!process.env.DATABASE_URL,
  };
  checks.env = { ok: env.jwt && env.database };

  const ok = Object.values(checks).every((c) => c.ok);

  return NextResponse.json(
    {
      ok,
      status: ok ? "healthy" : "degraded",
      checks,
      uptimeMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 },
  );
}
