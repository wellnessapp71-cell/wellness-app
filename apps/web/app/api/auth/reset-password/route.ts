import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createHash } from "crypto";
import { errorResponse, ok } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";
import { hashPassword } from "@/lib/auth/password";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const RATE_LIMIT = { windowMs: 60_000, maxRequests: 10 };

const schema = z.object({
  token: z.string().min(16),
  password: z.string().min(8).max(200),
}).strict();

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export async function POST(request: Request): Promise<NextResponse> {
  const ip = getClientIp(request);
  const rl = rateLimit(`reset:${ip}`, RATE_LIMIT);
  if (!rl.success) {
    return errorResponse(429, "RATE_LIMITED", "Too many reset attempts.");
  }

  const parsed = await parseRequestJson(request);
  if (!parsed.success) return errorResponse(parsed.status ?? 400, "INVALID_JSON", parsed.error);

  const validation = schema.safeParse(parsed.data);
  if (!validation.success) {
    return errorResponse(400, "INVALID_REQUEST", "Invalid payload.", validation.error.issues);
  }

  const tokenHash = hashToken(validation.data.token);
  const record = await prisma.passwordReset.findUnique({ where: { tokenHash } });

  if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
    return errorResponse(400, "INVALID_TOKEN", "This reset link is invalid or has expired.");
  }

  const passwordHash = await hashPassword(validation.data.password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordReset.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordReset.updateMany({
      where: { userId: record.userId, id: { not: record.id }, usedAt: null },
      data: { usedAt: new Date() },
    }),
  ]);

  return ok({ reset: true });
}
