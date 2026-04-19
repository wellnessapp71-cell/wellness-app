"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, ScrollText, Search } from "lucide-react";
import { GlassCard } from "@/components/wellness/glass-card";
import { fetchWithAuth, getStoredAuth } from "@/lib/client-auth";
import { PageHeader } from "@/components/portal-nav-shell";

interface ClickLogRow {
  id: string;
  userId: string;
  user: { id: string; name: string | null; email: string } | null;
  organization: { id: string; name: string } | null;
  department: string | null;
  section: string;
  screen: string;
  action: string;
  startTs: string;
  endTs: string | null;
  durationSeconds: number | null;
  device: string | null;
  platform: string | null;
  source: string | null;
}

const PAGE_SIZE = 50;

export function ClickLogsPage() {
  const [logs, setLogs] = useState<ClickLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({ section: "", from: "", to: "", userId: "", orgId: "" });
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.section) params.set("section", filters.section);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    if (filters.userId) params.set("userId", filters.userId);
    if (filters.orgId) params.set("organizationId", filters.orgId);
    params.set("take", String(PAGE_SIZE));
    params.set("skip", String(page * PAGE_SIZE));
    return params.toString();
  }, [filters, page]);

  async function load() {
    try {
      setError(null);
      const data = await fetchWithAuth<{ logs: ClickLogRow[]; total: number }>(
        `/api/web/admin/click-logs?${query}`,
      );
      setLogs(data.logs);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load logs.");
    }
  }

  useEffect(() => {
    void load();
  }, [query]);

  function exportCsv() {
    const params = new URLSearchParams();
    params.set("format", "csv");
    if (filters.section) params.set("section", filters.section);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    if (filters.userId) params.set("userId", filters.userId);
    if (filters.orgId) params.set("organizationId", filters.orgId);
    params.set("take", "500");
    const auth = getStoredAuth();
    fetch(`/api/web/admin/click-logs?${params}`, {
      headers: auth ? { Authorization: `Bearer ${auth.token}` } : {},
    })
      .then(async (res) => {
        const blob = await res.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `click-logs-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Export failed."));
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHeader
        title="Click & Access Logs"
        subtitle="Review section usage with time-stamped duration — filter and export to CSV."
        actions={
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-full bg-[#10242A] px-4 py-2 text-sm font-semibold text-white"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        }
      />

      <GlassCard className="mb-4 p-4">
        <div className="grid gap-3 md:grid-cols-5">
          <input
            value={filters.section}
            onChange={(e) => { setPage(0); setFilters((f) => ({ ...f, section: e.target.value })); }}
            placeholder="Section"
            className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none"
          />
          <input
            value={filters.userId}
            onChange={(e) => { setPage(0); setFilters((f) => ({ ...f, userId: e.target.value })); }}
            placeholder="User ID"
            className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none"
          />
          <input
            type="date"
            value={filters.from}
            onChange={(e) => { setPage(0); setFilters((f) => ({ ...f, from: e.target.value })); }}
            className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none"
          />
          <input
            type="date"
            value={filters.to}
            onChange={(e) => { setPage(0); setFilters((f) => ({ ...f, to: e.target.value })); }}
            className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none"
          />
          <button
            onClick={() => { setPage(0); void load(); }}
            className="rounded-[14px] bg-[#167C80] px-4 py-2 text-sm font-semibold text-white"
          >
            <Search className="mr-1 inline h-3.5 w-3.5" />
            Filter
          </button>
        </div>
      </GlassCard>

      {error ? <div className="mb-4 rounded-[16px] bg-[#FFF5F7] px-4 py-3 text-sm text-[#B42318]">{error}</div> : null}

      <GlassCard className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E6EEF1] text-xs uppercase tracking-wider text-[#56707B]">
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Org</th>
                <th className="px-4 py-3 text-left">Section</th>
                <th className="px-4 py-3 text-left">Screen</th>
                <th className="px-4 py-3 text-left">Action</th>
                <th className="px-4 py-3 text-left">Start</th>
                <th className="px-4 py-3 text-right">Duration</th>
                <th className="px-4 py-3 text-left">Device</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#56707B]">
                    No logs match these filters.
                  </td>
                </tr>
              ) : null}
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-[#F0F4F5] text-[#17303A] hover:bg-[#F8FBFC]">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1.5">
                      <ScrollText className="h-3.5 w-3.5 text-[#167C80]" />
                      <span className="text-xs">{l.user?.email ?? l.userId.slice(0, 10)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-xs text-[#56707B]">{l.organization?.name ?? "—"}</td>
                  <td className="px-4 py-2 font-mono text-xs">{l.section}</td>
                  <td className="px-4 py-2 text-xs">{l.screen}</td>
                  <td className="px-4 py-2 text-xs">{l.action}</td>
                  <td className="px-4 py-2 text-xs text-[#56707B]">{fmt(l.startTs)}</td>
                  <td className="px-4 py-2 text-right font-mono text-xs">
                    {l.durationSeconds != null ? `${l.durationSeconds}s` : "—"}
                  </td>
                  <td className="px-4 py-2 text-xs text-[#56707B]">
                    {[l.device, l.platform].filter(Boolean).join(" / ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <div className="mt-4 flex items-center justify-between text-sm text-[#56707B]">
        <span>{total} total • Page {page + 1} of {totalPages}</span>
        <div className="flex gap-2">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-full border border-[#D7E3E7] px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
          >
            Prev
          </button>
          <button
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-full border border-[#D7E3E7] px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}

function fmt(iso: string): string {
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}
