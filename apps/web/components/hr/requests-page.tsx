"use client";

import { useEffect, useState } from "react";
import { LifeBuoy, AlertTriangle, Clock, CheckCircle2, UserRound } from "lucide-react";
import { GlassCard } from "@/components/wellness/glass-card";
import { fetchWithAuth } from "@/lib/client-auth";
import { PageHeader } from "@/components/portal-nav-shell";

interface HelpRequestRow {
  id: string;
  employeeUserId: string;
  category: string;
  priority: "urgent" | "high" | "normal" | "low";
  subject: string | null;
  message: string | null;
  status: string;
  slaDueAt: string | null;
  closedAt: string | null;
  createdAt: string;
  employee: { id: string; name: string | null; email: string } | null;
  assignedTo: { id: string; name: string | null; email: string } | null;
}

interface Stats {
  total: number;
  open: number;
  inProgress: number;
  slaBreached: number;
}

const STATUS_FILTERS = ["all", "open", "in_progress", "escalated", "declined", "closed"] as const;
const PRIORITY_FILTERS = ["all", "urgent", "high", "normal", "low"] as const;

const PRIORITY_STYLES: Record<string, string> = {
  urgent: "bg-[#FFE6EA] text-[#B42318]",
  high: "bg-[#FFE6D8] text-[#A23F00]",
  normal: "bg-[#EAF4FF] text-[#0F6FFF]",
  low: "bg-[#F0F0F0] text-[#56707B]",
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-[#EAF4FF] text-[#0F6FFF]",
  in_progress: "bg-[#FFF6E0] text-[#9A6A00]",
  escalated: "bg-[#FFE6D8] text-[#A23F00]",
  declined: "bg-[#F0F0F0] text-[#56707B]",
  closed: "bg-[#E6F5EC] text-[#0A6D33]",
};

export function RequestsQueuePage() {
  const [requests, setRequests] = useState<HelpRequestRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (priorityFilter !== "all") params.set("priority", priorityFilter);
      const data = await fetchWithAuth<{ requests: HelpRequestRow[]; stats: Stats }>(
        `/api/web/hr/requests?${params}`,
      );
      setRequests(data.requests);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load requests.");
    }
  }

  useEffect(() => {
    void load();
  }, [statusFilter, priorityFilter]);

  async function handleAction(id: string, action: string) {
    const label = action.replace("_", " ");
    if (!confirm(`${label.charAt(0).toUpperCase() + label.slice(1)} this request?`)) return;
    setBusy(true);
    try {
      await fetchWithAuth("/api/web/hr/requests", {
        method: "PATCH",
        body: JSON.stringify({ id, action }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  const now = Date.now();

  return (
    <>
      <PageHeader
        title="Help Requests Queue"
        subtitle="Employee support requests by urgency and category — with SLA tracking and routing."
      />

      {stats ? (
        <div className="mb-4 grid gap-3 md:grid-cols-4">
          {[
            { label: "Total", value: stats.total, icon: LifeBuoy },
            { label: "Open", value: stats.open, icon: Clock },
            { label: "In progress", value: stats.inProgress, icon: UserRound },
            { label: "SLA breached", value: stats.slaBreached, icon: AlertTriangle },
          ].map((tile) => {
            const Icon = tile.icon;
            return (
              <GlassCard key={tile.label} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#167C80]/10 text-[#167C80]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-[#10242A]">{tile.value}</div>
                    <div className="text-xs text-[#56707B]">{tile.label}</div>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      ) : null}

      <GlassCard className="mb-4 p-3">
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                  statusFilter === s ? "bg-[#10242A] text-white" : "border border-[#D7E3E7] text-[#3A5661]"
                }`}
              >
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
          <div className="ml-auto flex flex-wrap gap-1.5">
            {PRIORITY_FILTERS.map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                  priorityFilter === p ? "bg-[#10242A] text-white" : "border border-[#D7E3E7] text-[#3A5661]"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {error ? <div className="mb-4 rounded-[16px] bg-[#FFF5F7] px-4 py-3 text-sm text-[#B42318]">{error}</div> : null}

      <div className="space-y-3">
        {requests.length === 0 ? (
          <GlassCard className="p-10 text-center text-sm text-[#56707B]">No help requests.</GlassCard>
        ) : null}
        {requests.map((req) => {
          const slaBreached = req.slaDueAt && new Date(req.slaDueAt).getTime() < now && req.status !== "closed";
          return (
            <GlassCard
              key={req.id}
              className={`p-5 ${slaBreached ? "border-l-4 border-l-[#B42318]" : ""}`}
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <LifeBuoy className="h-4 w-4 text-[#167C80]" />
                    <h3 className="text-sm font-semibold text-[#10242A]">
                      {req.subject ?? req.category}
                    </h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${PRIORITY_STYLES[req.priority] ?? ""}`}>
                      {req.priority}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_STYLES[req.status] ?? "bg-[#F0F0F0] text-[#56707B]"}`}>
                      {req.status.replace("_", " ")}
                    </span>
                    {slaBreached ? (
                      <span className="rounded-full bg-[#FFE6EA] px-2 py-0.5 text-[10px] font-bold uppercase text-[#B42318]">
                        SLA breached
                      </span>
                    ) : null}
                  </div>
                  {req.message ? (
                    <p className="mt-2 line-clamp-2 text-sm text-[#3A5661]">{req.message}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#56707B]">
                    <span>From: {req.employee?.name ?? req.employee?.email ?? "—"}</span>
                    <span>Category: {req.category}</span>
                    <span>Created: {fmt(req.createdAt)}</span>
                    {req.slaDueAt ? <span>SLA due: {fmt(req.slaDueAt)}</span> : null}
                    {req.assignedTo ? <span>Assigned: {req.assignedTo.name ?? req.assignedTo.email}</span> : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {req.status === "open" ? (
                    <>
                      <ActionButton disabled={busy} onClick={() => void handleAction(req.id, "accept")} variant="primary">
                        <CheckCircle2 className="h-3 w-3" />
                        Accept
                      </ActionButton>
                      <ActionButton disabled={busy} onClick={() => void handleAction(req.id, "decline")} variant="danger">
                        Decline
                      </ActionButton>
                      <ActionButton disabled={busy} onClick={() => void handleAction(req.id, "route_admin")} variant="secondary">
                        Route to admin
                      </ActionButton>
                      <ActionButton disabled={busy} onClick={() => void handleAction(req.id, "route_professional")} variant="secondary">
                        Route to professional
                      </ActionButton>
                    </>
                  ) : null}
                  {req.status === "in_progress" ? (
                    <ActionButton disabled={busy} onClick={() => void handleAction(req.id, "close")} variant="primary">
                      Close
                    </ActionButton>
                  ) : null}
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </>
  );
}

function ActionButton({
  children,
  variant,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  variant: "primary" | "secondary" | "danger";
  disabled?: boolean;
  onClick: () => void;
}) {
  const base = "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50";
  const styles = {
    primary: "bg-[#167C80] text-white hover:bg-[#0F5F62]",
    secondary: "border border-[#D7E3E7] text-[#3A5661] hover:bg-[#F4F8F9]",
    danger: "border border-[#F1D2D9] text-[#B42318] hover:bg-[#FFF5F7]",
  };
  return (
    <button disabled={disabled} onClick={onClick} className={`${base} ${styles[variant]}`}>
      {children}
    </button>
  );
}

function fmt(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
