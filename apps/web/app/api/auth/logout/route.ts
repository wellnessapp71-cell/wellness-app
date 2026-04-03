import { NextResponse } from "next/server";
import { methodNotAllowed, ok } from "@/lib/api/response";

export async function POST(): Promise<NextResponse> {
  // Stateless JWT logout is handled client-side by deleting stored token.
  return ok({ loggedOut: true });
}

export function GET(): NextResponse {
  return methodNotAllowed(["POST"]);
}
