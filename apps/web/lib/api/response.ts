import { NextResponse } from "next/server";

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export function ok<T>(data: T, init?: { status?: number }): NextResponse {
  return NextResponse.json(
    {
      ok: true as const,
      data,
    },
    { status: init?.status ?? 200 },
  );
}

export function okWithMeta<T>(
  meta: Record<string, string>,
  data: T,
  init?: { status?: number },
): NextResponse {
  return NextResponse.json(
    {
      ok: true as const,
      ...meta,
      data,
    },
    { status: init?.status ?? 200 },
  );
}

export function errorResponse(
  status: number,
  code: string,
  message: string,
  details?: unknown,
): NextResponse {
  const error: ApiErrorPayload = details === undefined ? { code, message } : { code, message, details };
  return NextResponse.json(
    {
      ok: false as const,
      error,
    },
    { status },
  );
}

export function methodNotAllowed(allowedMethods: string[]): NextResponse {
  return errorResponse(
    405,
    "METHOD_NOT_ALLOWED",
    `Method not allowed. Use ${allowedMethods.join(", ")}.`,
    { allowedMethods },
  );
}
