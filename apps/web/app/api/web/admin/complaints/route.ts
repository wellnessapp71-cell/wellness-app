import { prisma } from "@aura/db";
import { NextResponse } from "next/server";
import { ok } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/roles";

export async function GET(request: Request): Promise<NextResponse> {
  const { response } = requireRole(request, ["admin"]);
  if (response) return response;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const severity = url.searchParams.get("severity");
  const organizationId = url.searchParams.get("organizationId");
  const category = url.searchParams.get("category");

  const complaints = await prisma.complaint.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(severity ? { severity } : {}),
      ...(organizationId ? { organizationId } : {}),
      ...(category ? { category } : {}),
    },
    include: {
      reporter: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      organization: { select: { id: true, name: true } },
    },
    orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    take: 200,
  });

  return ok({ complaints });
}
