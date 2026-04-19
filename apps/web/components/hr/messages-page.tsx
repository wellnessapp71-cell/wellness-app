"use client";

import { useEffect, useState } from "react";
import { MessageSquare, AlertTriangle, Clock, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { GlassCard } from "@/components/wellness/glass-card";
import { fetchWithAuth } from "@/lib/client-auth";
import { PageHeader } from "@/components/portal-nav-shell";

interface ComplaintRow {
  id: string;
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
  reporter: { id: string; name: string | null; email: string };
  assignedTo: { id: string; name: string | null; email: string } | null;
}

interface Stats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  slaBreached: number;
}

interface ListResponse {
  complaints: ComplaintRow[];
  stats: Stats;
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const STATUS_FILTERS = ["all", "open", "in_progress", "resolved"] as const;
const SEVERITY_FILTERS = ["all", "low", "normal", "high", "critical"] as const;

const SEVERITY_STYLES: Record<string, string> = {
  low: "bg-[#F0F0F0] text-[#56707B]",
  normal: "bg-[#EAF4FF] text-[#0F6FFF]",
  high: "bg-[#FFE6D8] text-[#A23F00]",
  critical: "bg-[#FFE6EA] text-[#B42318]",
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-[#EAF4FF] text-[#0F6FFF]",
  in_progress: "bg-[#FFF6E0] text-[#9A6A00]",
  resolved: "bg-[#E6F5EC] text-[#0A6D33]",
};

export function MessagesPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");

  async function load(p = page) {
    try {
      setError(null);
      const params = new URLSearchParams({ page: String(p), limit: "25" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (severityFilter !== "all") params.set("severity", severityFilter);
      const res = await fetchWithAuth<{ data: ListResponse }>(`/api/web/hr/messages?${params}`);
      setData(res.data);
    } catch {
      setError("Failed to load complaints.");
    }
  }

  useEffect(() => { load(); }, [page, statusFilter, severityFilter]);

  async function handleAction(id: string, action: "assign" | "resolve" | "reopen", note?: string) {
    setBusy(true);
    try {
      await fetchWithAuth("/api/web/hr/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, resolutionNote: note }),
      });
      setResolveId(null);
      setResolutionNote("");
      load();
    } catch {
      setError(`Failed to ${action} complaint.`);
    } finally {
      setBusy(false);
    }
  }

  const isSlaBreached = (c: ComplaintRow) => c.status !== "resolved" && c.slaDueAt && new Date(c.slaDueAt) < new Date();

  return (
    <>
      <PageHeader title="Messages & Complaints" subtitle="Inbox for employee messages and complaints routed to HR." />

      {data?.stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: "Total", value: data.stats.total, icon: MessageSquare, color: "#167C80" },
            { label: "Open", value: data.stats.open, icon: Clock, color: "#0F6FFF" },
            { label: "In Progress", value: data.stats.inProgress, icon: Clock, color: "#9A6A00" },
            { label: "Resolved", value: data.stats.resolved, icon: CheckCircle2, color: "#0A6D33" },
            { label: "SLA Breached", value: data.stats.slaBreached, icon: AlertTriangle, color: "#B42318" },
          ].map((kpi) => (
            <GlassCard key={kpi.label}>
              <div className="flex items-center gap-2 mb-1">
                <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                <span className="text-xs uppercase tracking-wider text-[#56707B]">{kpi.label}</span>
              </div>
              <div className="text-xl font-bold text-white">{kpi.value}</div>
            </GlassCard>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-1 bg-[#10242A] rounded-[14px] p-1">
          {STATUS_FILTERS.map((s) => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className={`px-3 py-1.5 rounded-[10px] text-xs font-medium capitalize transition-colors ${statusFilter === s ? "bg-[#167C80] text-white" : "text-[#56707B] hover:text-white"}`}>
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-[#10242A] rounded-[14px] p-1">
          {SEVERITY_FILTERS.map((s) => (
            <button key={s} onClick={() => { setSeverityFilter(s); setPage(1); }} className={`px-3 py-1.5 rounded-[10px] text-xs font-medium capitalize transition-colors ${severityFilter === s ? "bg-[#167C80] text-white" : "text-[#56707B] hover:text-white"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="bg-[#FFE6EA]/10 border border-[#B42318]/30 text-[#B42318] rounded-[14px] p-4 mb-6">{error}</div>}

      {data && (
        <div className="space-y-3">
          {data.complaints.length === 0 && (
            <GlassCard><p className="text-[#56707B] text-center py-8">No complaints found.</p></GlassCard>
          )}
          {data.complaints.map((c) => (
            <GlassCard key={c.id} className={isSlaBreached(c) ? "border border-[#B42318]/30" : ""}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-white">{c.subject}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[c.status] ?? ""}`}>{c.status.replace("_", " ")}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_STYLES[c.severity] ?? ""}`}>{c.severity}</span>
                    <span className="bg-[#1a3a44] text-[#56707B] px-2 py-0.5 rounded-full text-xs">{c.category}</span>
                    {isSlaBreached(c) && <span className="bg-[#FFE6EA] text-[#B42318] px-2 py-0.5 rounded-full text-xs font-medium">SLA Breached</span>}
                  </div>
                  <p className="text-xs text-[#56707B] mt-1 line-clamp-2">{c.body}</p>
                  <div className="text-xs text-[#56707B] mt-2 flex flex-wrap gap-3">
                    <span>From: {c.reporter.name ?? c.reporter.email}</span>
                    {c.assignedTo && <span>Assigned: {c.assignedTo.name ?? c.assignedTo.email}</span>}
                    <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                    {c.slaDueAt && <span>SLA: {new Date(c.slaDueAt).toLocaleDateString()}</span>}
                  </div>
                  {c.resolutionNote && <p className="text-xs text-[#0A6D33] mt-2 bg-[#E6F5EC]/20 p-2 rounded-lg">{c.resolutionNote}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  {c.status === "open" && (
                    <button onClick={() => handleAction(c.id, "assign")} disabled={busy} className="text-xs bg-[#167C80] text-white px-3 py-1.5 rounded-[10px] hover:bg-[#167C80]/80 disabled:opacity-50">
                      Assign to me
                    </button>
                  )}
                  {(c.status === "open" || c.status === "in_progress") && resolveId !== c.id && (
                    <button onClick={() => setResolveId(c.id)} className="text-xs bg-[#0A6D33] text-white px-3 py-1.5 rounded-[10px] hover:bg-[#0A6D33]/80">
                      Resolve
                    </button>
                  )}
                  {c.status === "resolved" && (
                    <button onClick={() => handleAction(c.id, "reopen")} disabled={busy} className="text-xs bg-[#56707B]/20 text-[#56707B] px-3 py-1.5 rounded-[10px] hover:text-white">
                      Reopen
                    </button>
                  )}
                </div>
              </div>
              {resolveId === c.id && (
                <div className="mt-3 pt-3 border-t border-[#56707B]/10 flex gap-2">
                  <input type="text" value={resolutionNote} onChange={(e) => setResolutionNote(e.target.value)} placeholder="Resolution note..." className="flex-1 bg-[#10242A] border border-[#56707B]/30 rounded-[10px] px-3 py-1.5 text-sm text-white" />
                  <button onClick={() => handleAction(c.id, "resolve", resolutionNote)} disabled={busy} className="text-xs bg-[#0A6D33] text-white px-3 py-1.5 rounded-[10px] disabled:opacity-50">
                    Confirm
                  </button>
                  <button onClick={() => { setResolveId(null); setResolutionNote(""); }} className="text-xs text-[#56707B] px-3 py-1.5">Cancel</button>
                </div>
              )}
            </GlassCard>
          ))}

          {data.pages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="flex items-center gap-1 text-sm text-[#167C80] disabled:text-[#56707B]/30">
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <span className="text-xs text-[#56707B]">Page {data.page} of {data.pages}</span>
              <button onClick={() => setPage((p) => Math.min(data.pages, p + 1))} disabled={page >= data.pages} className="flex items-center gap-1 text-sm text-[#167C80] disabled:text-[#56707B]/30">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
