import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { ok, errorResponse } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/roles";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { response } = requireRole(request, ["admin"]);
  if (response) {
    return response;
  }

  const { id } = await params;

  try {
    await prisma.organization.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (error) {
    return errorResponse(500, "DELETE_ORGANIZATION_ERROR", "Unable to delete organization.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
