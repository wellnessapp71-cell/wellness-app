import { Resend } from "resend";

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: EmailAttachment[];
  replyTo?: string;
}

export interface SendEmailResult {
  id: string | null;
  skipped?: boolean;
  error?: string;
}

let cached: Resend | null = null;

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!cached) cached = new Resend(key);
  return cached;
}

export function getFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL || "Aura Wellness <notifications@aura.health>";
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const client = getClient();
  if (!client) {
    console.warn("[resend] RESEND_API_KEY not configured — skipping email", { subject: input.subject });
    return { id: null, skipped: true };
  }

  const payload: Record<string, unknown> = {
    from: getFromAddress(),
    to: input.to,
    subject: input.subject,
  };
  if (input.html) payload.html = input.html;
  if (input.text) payload.text = input.text;
  if (input.replyTo) payload.replyTo = input.replyTo;
  if (input.attachments?.length) {
    payload.attachments = input.attachments.map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType,
    }));
  }
  if (!payload.html && !payload.text) payload.text = input.subject;

  const { data, error } = await client.emails.send(payload as unknown as Parameters<typeof client.emails.send>[0]);

  if (error) {
    console.error("[resend] send failed", error);
    return { id: null, error: error.message ?? "send failed" };
  }
  return { id: data?.id ?? null };
}
