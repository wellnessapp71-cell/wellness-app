import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createHash, randomBytes } from "crypto";
import { errorResponse, ok } from "@/lib/api/response";
import { parseRequestJson } from "@/lib/api/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email/resend";

const RATE_LIMIT = { windowMs: 60_000, maxRequests: 3 };
const TOKEN_TTL_MINUTES = 30;

const schema = z.object({ email: z.string().trim().email() }).strict();

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function resolveAppBaseUrl(request: Request): string {
  const fromEnv = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function POST(request: Request): Promise<NextResponse> {
  const ip = getClientIp(request);
  const rl = rateLimit(`forgot:${ip}`, RATE_LIMIT);
  if (!rl.success) {
    return errorResponse(429, "RATE_LIMITED", "Too many reset requests. Try again later.");
  }

  const parsed = await parseRequestJson(request);
  if (!parsed.success) return errorResponse(parsed.status ?? 400, "INVALID_JSON", parsed.error);

  const validation = schema.safeParse(parsed.data);
  if (!validation.success) {
    return errorResponse(400, "INVALID_REQUEST", "Email is required.", validation.error.issues);
  }

  const email = validation.data.email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true },
  });

  // Always return success to avoid email enumeration
  if (!user) {
    return ok({ sent: true });
  }

  const raw = randomBytes(32).toString("hex");
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60_000);

  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
      requestIp: ip ?? null,
    },
  });

  const baseUrl = resolveAppBaseUrl(request);
  const resetUrl = `${baseUrl}/reset-password?token=${raw}`;

  const html = `<div style="font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#0f2628;max-width:520px;">
<h2 style="color:#167C80;margin:0 0 16px;">Reset your Aura Wellness password</h2>
<p>Hi${user.name ? ` ${user.name}` : ""},</p>
<p>We received a request to reset your password. Click the button below to choose a new one. This link expires in ${TOKEN_TTL_MINUTES} minutes.</p>
<p style="margin:24px 0;">
  <a href="${resetUrl}" style="background:#167C80;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Reset password</a>
</p>
<p style="color:#5a6b6e;font-size:12px;">If you didn't request this, you can safely ignore this email — your password will stay the same.</p>
<p style="color:#5a6b6e;font-size:12px;">Or copy this link: ${resetUrl}</p>
</div>`;

  await sendEmail({
    to: user.email,
    subject: "Reset your Aura Wellness password",
    html,
    text: `Reset your password: ${resetUrl}\n\nThis link expires in ${TOKEN_TTL_MINUTES} minutes.`,
  });

  return ok({ sent: true });
}
