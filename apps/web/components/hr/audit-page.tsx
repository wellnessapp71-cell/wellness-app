"use client";

import { useEffect, useState } from "react";
import { ScrollText, Download, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { GlassCard } from "@/components/wellness/glass-card";
import { fetchWithAuth, getStoredAuth } from "@/lib/client-auth";
import { PageHeader } from "@/components/portal-nav-shell";

interface AuditLogRow {
  id: string;
  eventType: string;
  targetType: string | null;
  targetId: string | null;
  summary: string;
  ipAddress: string | null;
  createdAt: string;
  actor: { id: string; name: string | null; email: string } | null;
}

interface EventTypeCount {
  type: string;
  count: number;
}

interface ListResponse {
  logs: AuditLogRow[];
  eventTypes: EventTypeCount[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export function AuditHistoryPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  async function load(p = page) {
    try {
      setError(null);
      const params = new URLSearchParams({ page: String(p), limit: "50" });
      if (eventTypeFilter) params.set("eventType", eventTypeFilter);
      if (dateRange.from) params.set("from", dateRange.from);
      if (dateRange.to) params.set("to", dateRange.to);
      const res = await fetchWithAuth<{ data: ListResponse }>(`/api/web/hr/audit?${params}`);
      setData(res.data);
    } catch {
      setError("Failed to load audit logs.");
    }
  }

  useEffect(() => { load(); }, [page]);

  function handleFilter() {
    setPage(1);
    load(1);
  }

  async function exportCsv() {
    try {
      const params = new URLSearchParams({ format: "csv" });
      if (eventTypeFilter) params.set("eventType", eventTypeFilter);
      if (dateRange.from) params.set("from", dateRange.from);
      if (dateRange.to) params.set("to", dateRange.to);
      const auth = getStoredAuth();
      const res = await fetch(`/api/web/hr/audit?${params}`, {
        headers: auth ? { Authorization: `Bearer ${auth.token}` } : {},
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to export CSV.");
    }
  }

  return (
    <>
      <PageHeader title="Audit History" subtitle="HR-side record of who viewed what, approved what, and changed what — compliance-ready." />

      <div className="flex flex-wrap gap-3 mb-6">
        <input type="text" value={eventTypeFilter} onChange={(e) => setEventTypeFilter(e.target.value)} placeholder="Filter by event type..." className="bg-[#10242A] border border-[#56707B]/30 rounded-[14px] px-3 py-2 text-sm text-white placeholder:text-[#56707B]" />
        <input type="date" value={dateRange.from} onChange={(e) => setDateRange((p) => ({ ...p, from: e.target.value }))} className="bg-[#10242A] border border-[#56707B]/30 rounded-[14px] px-3 py-2 text-sm text-white" />
        <input type="date" value={dateRange.to} onChange={(e) => setDateRange((p) => ({ ...p, to: e.target.value }))} className="bg-[#10242A] border border-[#56707B]/30 rounded-[14px] px-3 py-2 text-sm text-white" />
        <button onClick={handleFilter} className="flex items-center gap-1 bg-[#167C80] hover:bg-[#167C80]/80 text-white px-4 py-2 rounded-[14px] text-sm font-medium transition-colors">
          <Search className="w-4 h-4" /> Filter
        </button>
        <button onClick={exportCsv} className="flex items-center gap-1 bg-[#10242A] border border-[#56707B]/30 text-[#56707B] hover:text-white px-4 py-2 rounded-[14px] text-sm font-medium transition-colors ml-auto">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {data?.eventTypes && data.eventTypes.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {data.eventTypes.map((et) => (
            <button
              key={et.type}
              onClick={() => { setEventTypeFilter(eventTypeFilter === et.type ? "" : et.type); handleFilter(); }}
              className={`px-3 py-1.5 rounded-[10px] text-xs font-medium transition-colors ${eventTypeFilter === et.type ? "bg-[#167C80] text-white" : "bg-[#1a3a44] text-[#56707B] hover:text-white"}`}
            >
              {et.type} ({et.count})
            </button>
          ))}
        </div>
      )}

      {error && <div className="bg-[#FFE6EA]/10 border border-[#B42318]/30 text-[#B42318] rounded-[14px] p-4 mb-6">{error}</div>}

      {data && (
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-[#56707B]">{data.total} audit entries</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#56707B] text-xs uppercase">
                  <th className="text-left py-2 pr-4">Timestamp</th>
                  <th className="text-left py-2 px-2">Actor</th>
                  <th className="text-left py-2 px-2">Event</th>
                  <th className="text-left py-2 px-2">Target</th>
                  <th className="text-left py-2 pl-2">Summary</th>
                </tr>
              </thead>
              <tbody>
                {data.logs.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-[#56707B]">No audit entries found.</td></tr>
                )}
                {data.logs.map((log) => (
                  <tr key={log.id} className="border-t border-[#56707B]/10 hover:bg-[#167C80]/5">
                    <td className="py-2 pr-4 text-[#56707B] text-xs whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="py-2 px-2">
                      <div className="text-white text-xs">{log.actor?.name ?? log.actor?.email ?? "System"}</div>
                      {log.ipAddress && <div className="text-[10px] text-[#56707B]">{log.ipAddress}</div>}
                    </td>
                    <td className="py-2 px-2">
                      <span className="bg-[#1a3a44] text-[#56707B] px-2 py-0.5 rounded-full text-xs">{log.eventType}</span>
                    </td>
                    <td className="py-2 px-2 text-xs text-[#56707B]">
                      {log.targetType && <span>{log.targetType}{log.targetId ? `:${log.targetId.slice(0, 8)}` : ""}</span>}
                    </td>
                    <td className="py-2 pl-2 text-xs text-white max-w-xs truncate">{log.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.pages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#56707B]/10">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="flex items-center gap-1 text-sm text-[#167C80] disabled:text-[#56707B]/30">
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <span className="text-xs text-[#56707B]">Page {data.page} of {data.pages}</span>
              <button onClick={() => setPage((p) => Math.min(data.pages, p + 1))} disabled={page >= data.pages} className="flex items-center gap-1 text-sm text-[#167C80] disabled:text-[#56707B]/30">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </GlassCard>
      )}
    </>
  );
}
