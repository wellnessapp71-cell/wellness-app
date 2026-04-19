"use client";

import { useEffect, useState } from "react";
import { Download, ScrollText } from "lucide-react";
import { GlassCard } from "@/components/wellness/glass-card";
import { fetchWithAuth, getStoredAuth } from "@/lib/client-auth";
import { PageHeader } from "@/components/portal-nav-shell";

interface AuditLog {
  id: string;
  createdAt: string;
  actor: { id: string; name: string | null; email: string } | null;
  actorRole: string | null;
  organization: { id: string; name: string } | null;
  eventType: string;
  targetType: string | null;
  targetId: string | null;
  summary: string;
  ipAddress: string | null;
  payload: unknown;
}

interface ListResponse {
  logs: AuditLog[];
}

export function AuditLogViewerPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filters, setFilters] = useState({ eventType: "", from: "", to: "" });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (filters.eventType) params.set("eventType", filters.eventType);
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);
      const data = await fetchWithAuth<ListResponse>(`/api/web/admin/audit-logs?${params}`);
      setLogs(data.logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load audit logs.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function handleExport() {
    const params = new URLSearchParams();
    params.set("format", "csv");
    if (filters.eventType) params.set("eventType", filters.eventType);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    const auth = getStoredAuth();
    const url = `/api/web/admin/audit-logs?${params}`;
    fetch(url, { headers: auth ? { Authorization: `Bearer ${auth.token}` } : {} })
      .then(async (res) => {
        const blob = await res.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Export failed."));
  }

  return (
    <>
      <PageHeader
        title="Audit Log Viewer"
        subtitle="Who viewed, approved, or changed what — filter and export for compliance."
        actions={
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-full bg-[#10242A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#17303A]"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        }
      />
      <GlassCard className="p-6">
        <div className="mb-4 grid gap-3 md:grid-cols-4">
          <input
            value={filters.eventType}
            onChange={(e) => setFilters((f) => ({ ...f, eventType: e.target.value }))}
            placeholder="Event type (e.g. admin.referral_code)"
            className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none"
          />
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
            className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none"
          />
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
            className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none"
          />
          <button
            onClick={() => void load()}
            className="rounded-[14px] bg-[#167C80] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0F5F62]"
          >
            Apply filters
          </button>
        </div>
        {error ? (
          <div className="mb-4 rounded-[16px] bg-[#FFF5F7] px-4 py-3 text-sm text-[#B42318]">{error}</div>
        ) : null}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E6EEF1] text-xs uppercase tracking-wider text-[#56707B]">
                <th className="py-2 pr-3 text-left">When</th>
                <th className="py-2 pr-3 text-left">Actor</th>
                <th className="py-2 pr-3 text-left">Event</th>
                <th className="py-2 pr-3 text-left">Summary</th>
                <th className="py-2 pr-3 text-left">Org</th>
                <th className="py-2 pr-3 text-left">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-[#56707B]">
                    No audit events.
                  </td>
                </tr>
              ) : null}
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-[#F0F4F5] text-[#17303A]">
                  <td className="py-2 pr-3 text-xs text-[#56707B]">{formatDate(log.createdAt)}</td>
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-1.5">
                      <ScrollText className="h-3.5 w-3.5 text-[#167C80]" />
                      <span className="text-xs">{log.actor?.email ?? "system"}</span>
                      {log.actorRole ? (
                        <span className="rounded-full bg-[#EEF6F7] px-1.5 py-0.5 text-[9px] font-semibold uppercase text-[#167C80]">
                          {log.actorRole}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="py-2 pr-3 font-mono text-xs text-[#3A5661]">{log.eventType}</td>
                  <td className="py-2 pr-3 text-sm">{log.summary}</td>
                  <td className="py-2 pr-3 text-xs text-[#56707B]">{log.organization?.name ?? "—"}</td>
                  <td className="py-2 pr-3 font-mono text-xs text-[#56707B]">{log.ipAddress ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
