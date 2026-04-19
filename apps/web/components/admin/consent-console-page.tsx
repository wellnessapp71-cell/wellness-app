"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ShieldCheck, ShieldX, XCircle } from "lucide-react";
import { GlassCard } from "@/components/wellness/glass-card";
import { fetchWithAuth } from "@/lib/client-auth";
import { PageHeader } from "@/components/portal-nav-shell";

interface AccessRequest {
  id: string;
  hr: { id: string; name: string | null; email: string };
  employee: { id: string; name: string | null; email: string };
  organization: { id: string; name: string };
  scope: unknown;
  reason: string;
  purpose: string | null;
  status: string;
  requestedAt: string;
  approvedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  denialReason: string | null;
  approvedBy: { id: string; name: string | null; email: string } | null;
}

interface ListResponse {
  requests: AccessRequest[];
}

export function ConsentConsolePage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("pending");
  const [expiryInputs, setExpiryInputs] = useState<Record<string, string>>({});
  const [denialInputs, setDenialInputs] = useState<Record<string, string>>({});

  async function load() {
    try {
      setError(null);
      const data = await fetchWithAuth<ListResponse>("/api/web/admin/access-approvals");
      setRequests(data.requests);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load access requests.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return requests;
    return requests.filter((r) => r.status === filter);
  }, [requests, filter]);

  async function handleAction(id: string, action: "approve" | "deny" | "revoke") {
    try {
      const body: Record<string, unknown> = { action };
      if (action === "approve" && expiryInputs[id]) {
        body.expiresAt = new Date(expiryInputs[id]).toISOString();
      }
      if (action === "deny") {
        body.denialReason = denialInputs[id] || "Not approved";
      }
      await fetchWithAuth(`/api/web/admin/access-approvals/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    }
  }

  return (
    <>
      <PageHeader
        title="Consent & Approval Console"
        subtitle="Review HR requests for employee-level visibility. Approve with minimum-necessary scope and expiry."
      />
      <GlassCard className="p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-[#10242A]">Access requests</h2>
          <div className="flex gap-1 rounded-full bg-[#EEF2F4] p-1">
            {["pending", "approved", "denied", "revoked", "all"].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${
                  filter === s ? "bg-white text-[#10242A] shadow-sm" : "text-[#56707B]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        {error ? (
          <div className="mb-4 rounded-[16px] bg-[#FFF5F7] px-4 py-3 text-sm text-[#B42318]">{error}</div>
        ) : null}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <p className="rounded-[18px] bg-[#F6F9FA] p-6 text-center text-sm text-[#56707B]">
              No requests in this view.
            </p>
          ) : null}
          {filtered.map((req) => (
            <div key={req.id} className="rounded-[22px] border border-[#E6EEF1] bg-[#FBFDFE] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#167C80]" />
                    <span className="text-sm font-semibold text-[#10242A]">
                      HR {req.hr.name ?? req.hr.email} → Employee {req.employee.name ?? req.employee.email}
                    </span>
                    <StatusBadge status={req.status} />
                  </div>
                  <p className="mt-1 text-xs text-[#56707B]">
                    {req.organization.name} • scope: {renderScope(req.scope)} • requested {formatDate(req.requestedAt)}
                  </p>
                  <p className="mt-2 text-sm text-[#3A5661]">
                    <span className="font-semibold">Reason:</span> {req.reason}
                  </p>
                  {req.purpose ? (
                    <p className="mt-1 text-sm text-[#3A5661]">
                      <span className="font-semibold">Purpose:</span> {req.purpose}
                    </p>
                  ) : null}
                  {req.status === "approved" && req.expiresAt ? (
                    <p className="mt-1 text-xs text-[#0A6A4A]">Expires {formatDate(req.expiresAt)}</p>
                  ) : null}
                  {req.status === "denied" && req.denialReason ? (
                    <p className="mt-1 text-xs text-[#B42318]">Denied: {req.denialReason}</p>
                  ) : null}
                </div>
                {req.status === "pending" ? (
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <input
                      type="datetime-local"
                      value={expiryInputs[req.id] ?? ""}
                      onChange={(e) => setExpiryInputs((prev) => ({ ...prev, [req.id]: e.target.value }))}
                      className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-1.5 text-xs text-[#17303A] outline-none"
                      placeholder="Access expiry"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => void handleAction(req.id, "approve")}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#0A6A4A] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#07553A]"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() => void handleAction(req.id, "deny")}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#F1D2D9] px-3 py-1.5 text-xs font-semibold text-[#B42318] transition hover:bg-[#FFF5F7]"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Deny
                      </button>
                    </div>
                    <input
                      value={denialInputs[req.id] ?? ""}
                      onChange={(e) => setDenialInputs((prev) => ({ ...prev, [req.id]: e.target.value }))}
                      placeholder="Denial reason (optional)"
                      className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-1.5 text-xs text-[#17303A] outline-none"
                    />
                  </div>
                ) : req.status === "approved" ? (
                  <button
                    onClick={() => void handleAction(req.id, "revoke")}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#F1D2D9] px-3 py-1.5 text-xs font-semibold text-[#B42318] transition hover:bg-[#FFF5F7]"
                  >
                    <ShieldX className="h-3.5 w-3.5" />
                    Revoke
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </>
  );
}

function renderScope(scope: unknown): string {
  if (Array.isArray(scope)) return scope.join(", ");
  return "—";
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "approved"
      ? "bg-[#E6F4EF] text-[#0A6A4A]"
      : status === "denied" || status === "revoked"
        ? "bg-[#FFECEF] text-[#B42318]"
        : "bg-[#FEF4E6] text-[#A1631A]";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tone}`}>
      {status}
    </span>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
