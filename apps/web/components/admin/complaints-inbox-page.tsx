"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, LifeBuoy } from "lucide-react";
import { GlassCard } from "@/components/wellness/glass-card";
import { fetchWithAuth } from "@/lib/client-auth";
import { PageHeader } from "@/components/portal-nav-shell";

interface Complaint {
  id: string;
  reporter: { id: string; name: string | null; email: string };
  assignedTo: { id: string; name: string | null; email: string } | null;
  organization: { id: string; name: string } | null;
  category: string;
  severity: string;
  subject: string;
  body: string;
  source: string;
  status: string;
  slaDueAt: string | null;
  resolvedAt: string | null;
  resolutionNote: string | null;
  createdAt: string;
}

interface ListResponse {
  complaints: Complaint[];
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In progress" },
  { key: "escalated", label: "Escalated" },
  { key: "resolved", label: "Resolved" },
  { key: "closed", label: "Closed" },
];

export function ComplaintsInboxPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filter, setFilter] = useState("open");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});

  async function load() {
    try {
      setError(null);
      const data = await fetchWithAuth<ListResponse>("/api/web/admin/complaints");
      setComplaints(data.complaints);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load complaints.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      if (filter !== "all" && c.status !== filter) return false;
      if (severityFilter !== "all" && c.severity !== severityFilter) return false;
      return true;
    });
  }, [complaints, filter, severityFilter]);

  async function updateComplaint(id: string, body: Record<string, unknown>) {
    try {
      await fetchWithAuth(`/api/web/admin/complaints/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    }
  }

  return (
    <>
      <PageHeader
        title="Complaints & Support Inbox"
        subtitle="Unified queue for employee, HR, and technical complaints — routed by severity with SLA timers."
      />
      <GlassCard className="p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 rounded-full bg-[#EEF2F4] p-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  filter === f.key ? "bg-white text-[#10242A] shadow-sm" : "text-[#56707B]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-full border border-[#D7E3E7] bg-white px-3 py-1.5 text-xs font-semibold text-[#17303A] outline-none"
          >
            <option value="all">All severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        </div>
        {error ? (
          <div className="mb-4 rounded-[16px] bg-[#FFF5F7] px-4 py-3 text-sm text-[#B42318]">{error}</div>
        ) : null}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <p className="rounded-[18px] bg-[#F6F9FA] p-6 text-center text-sm text-[#56707B]">
              No complaints in this view.
            </p>
          ) : null}
          {filtered.map((c) => (
            <div key={c.id} className="rounded-[22px] border border-[#E6EEF1] bg-[#FBFDFE] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityIcon severity={c.severity} />
                    <span className="text-sm font-semibold text-[#10242A]">{c.subject}</span>
                    <SeverityBadge severity={c.severity} />
                    <StatusBadge status={c.status} />
                    <span className="rounded-full bg-[#EEF6F7] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#167C80]">
                      {c.category}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#56707B]">
                    {c.source} • {c.reporter.name ?? c.reporter.email}
                    {c.organization ? ` • ${c.organization.name}` : ""} • {formatDate(c.createdAt)}
                    {c.slaDueAt ? ` • SLA ${formatSla(c.slaDueAt)}` : ""}
                  </p>
                  <p className="mt-2 text-sm text-[#3A5661]">{c.body}</p>
                  {c.resolutionNote ? (
                    <p className="mt-2 rounded-[12px] bg-[#E6F4EF] px-3 py-2 text-xs text-[#0A6A4A]">
                      Resolution: {c.resolutionNote}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-stretch gap-2">
                  <select
                    value={c.status}
                    onChange={(e) => void updateComplaint(c.id, { status: e.target.value })}
                    className="rounded-full border border-[#D7E3E7] bg-white px-3 py-1.5 text-xs font-semibold text-[#17303A] outline-none"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In progress</option>
                    <option value="escalated">Escalated</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  <select
                    value={c.severity}
                    onChange={(e) => void updateComplaint(c.id, { severity: e.target.value })}
                    className="rounded-full border border-[#D7E3E7] bg-white px-3 py-1.5 text-xs font-semibold text-[#17303A] outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                  {c.status !== "resolved" && c.status !== "closed" ? (
                    <div className="flex flex-col gap-1.5">
                      <input
                        value={resolutionNotes[c.id] ?? ""}
                        onChange={(e) =>
                          setResolutionNotes((prev) => ({ ...prev, [c.id]: e.target.value }))
                        }
                        placeholder="Resolution note"
                        className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-1.5 text-xs outline-none"
                      />
                      <button
                        onClick={() =>
                          void updateComplaint(c.id, {
                            status: "resolved",
                            resolutionNote: resolutionNotes[c.id] ?? undefined,
                          })
                        }
                        className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#0A6A4A] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#07553A]"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Resolve
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </>
  );
}

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === "critical" || severity === "high") return <AlertTriangle className="h-4 w-4 text-[#B42318]" />;
  if (severity === "low") return <LifeBuoy className="h-4 w-4 text-[#56707B]" />;
  return <Clock className="h-4 w-4 text-[#167C80]" />;
}

function SeverityBadge({ severity }: { severity: string }) {
  const tone =
    severity === "critical"
      ? "bg-[#FFECEF] text-[#B42318]"
      : severity === "high"
        ? "bg-[#FEF4E6] text-[#A1631A]"
        : severity === "low"
          ? "bg-[#EEF2F4] text-[#56707B]"
          : "bg-[#EEF6F7] text-[#167C80]";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tone}`}>
      {severity}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "resolved"
      ? "bg-[#E6F4EF] text-[#0A6A4A]"
      : status === "closed"
        ? "bg-[#EEF2F4] text-[#56707B]"
        : status === "escalated"
          ? "bg-[#FFECEF] text-[#B42318]"
          : status === "in_progress"
            ? "bg-[#EAF4FF] text-[#0F6FFF]"
            : "bg-[#FEF4E6] text-[#A1631A]";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tone}`}>
      {status.replace("_", " ")}
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

function formatSla(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms < 0) return "overdue";
  const hours = Math.round(ms / (60 * 60 * 1000));
  if (hours < 24) return `${hours}h left`;
  return `${Math.round(hours / 24)}d left`;
}
