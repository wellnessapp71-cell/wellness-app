"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Eye } from "lucide-react";
import { GlassCard } from "@/components/wellness/glass-card";
import { fetchWithAuth } from "@/lib/client-auth";
import { PageHeader } from "@/components/portal-nav-shell";

interface AlertRow {
  id: string;
  organizationId: string | null;
  organization: { id: string; name: string } | null;
  alertType: string;
  severity: string;
  module: string | null;
  summary: string;
  details: unknown;
  status: string;
  detectedAt: string;
  resolvedAt: string | null;
}

interface Stats {
  total: number;
  open: number;
  acknowledged: number;
  resolved: number;
}

const STATUS_FILTERS = ["all", "open", "acknowledged", "resolved"] as const;
const SEVERITY_FILTERS = ["all", "info", "warning", "error", "critical"] as const;

const SEVERITY_STYLES: Record<string, string> = {
  info: "bg-[#EAF4FF] text-[#0F6FFF]",
  warning: "bg-[#FFF6E0] text-[#9A6A00]",
  error: "bg-[#FFE6D8] text-[#A23F00]",
  critical: "bg-[#FFE6EA] text-[#B42318]",
};

export function DataQualityPage() {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (severityFilter !== "all") params.set("severity", severityFilter);
      const data = await fetchWithAuth<{ alerts: AlertRow[]; stats: Stats }>(`/api/web/admin/data-quality?${params}`);
      setAlerts(data.alerts);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load alerts.");
    }
  }

  useEffect(() => { void load(); }, [statusFilter, severityFilter]);

  async function handleAction(id: string) {
    setBusy(true);
    try {
      await fetchWithAuth("/api/web/admin/data-quality", { method: "PATCH", body: JSON.stringify({ id }) });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Data Quality & Anomaly Alerts"
        subtitle="Surface missing events, duplicates, suspicious spikes, stale integrations, and pipeline issues."
      />

      {stats ? (
        <div className="mb-4 grid gap-3 md:grid-cols-4">
          {[
            { label: "Total", value: stats.total, color: "text-[#10242A]" },
            { label: "Open", value: stats.open, color: "text-[#B42318]" },
            { label: "Acknowledged", value: stats.acknowledged, color: "text-[#9A6A00]" },
            { label: "Resolved", value: stats.resolved, color: "text-[#0A6D33]" },
          ].map((t) => (
            <GlassCard key={t.label} className="p-4 text-center">
              <div className={`text-2xl font-semibold ${t.color}`}>{t.value}</div>
              <div className="text-xs text-[#56707B]">{t.label}</div>
            </GlassCard>
          ))}
        </div>
      ) : null}

      <GlassCard className="mb-4 p-3">
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${statusFilter === s ? "bg-[#10242A] text-white" : "border border-[#D7E3E7] text-[#3A5661]"}`}>
                {s}
              </button>
            ))}
          </div>
          <div className="ml-auto flex flex-wrap gap-1.5">
            {SEVERITY_FILTERS.map((s) => (
              <button key={s} onClick={() => setSeverityFilter(s)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${severityFilter === s ? "bg-[#10242A] text-white" : "border border-[#D7E3E7] text-[#3A5661]"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {error ? <div className="mb-4 rounded-[16px] bg-[#FFF5F7] px-4 py-3 text-sm text-[#B42318]">{error}</div> : null}

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <GlassCard className="p-10 text-center text-sm text-[#56707B]">No alerts.</GlassCard>
        ) : null}
        {alerts.map((a) => (
          <GlassCard key={a.id} className={`p-5 ${a.severity === "critical" ? "border-l-4 border-l-[#B42318]" : a.severity === "error" ? "border-l-4 border-l-[#A23F00]" : ""}`}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-[#B42318]" />
                  <h3 className="text-sm font-semibold text-[#10242A]">{a.summary}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${SEVERITY_STYLES[a.severity] ?? "bg-[#F0F0F0] text-[#56707B]"}`}>{a.severity}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    a.status === "resolved" ? "bg-[#E6F5EC] text-[#0A6D33]" : a.status === "acknowledged" ? "bg-[#FFF6E0] text-[#9A6A00]" : "bg-[#FFE6EA] text-[#B42318]"
                  }`}>{a.status}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#56707B]">
                  <span>Type: {a.alertType}</span>
                  {a.module ? <span>Module: {a.module}</span> : null}
                  {a.organization ? <span>Org: {a.organization.name}</span> : null}
                  <span>Detected: {fmt(a.detectedAt)}</span>
                  {a.resolvedAt ? <span>Resolved: {fmt(a.resolvedAt)}</span> : null}
                </div>
              </div>
              <div className="flex gap-2">
                {a.status === "open" ? (
                  <button disabled={busy} onClick={() => void handleAction(a.id)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF6E0] px-3 py-1.5 text-xs font-semibold text-[#9A6A00] disabled:opacity-50">
                    <Eye className="h-3 w-3" /> Acknowledge
                  </button>
                ) : null}
                {a.status === "acknowledged" ? (
                  <button disabled={busy} onClick={() => void handleAction(a.id)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#E6F5EC] px-3 py-1.5 text-xs font-semibold text-[#0A6D33] disabled:opacity-50">
                    <CheckCircle2 className="h-3 w-3" /> Resolve
                  </button>
                ) : null}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </>
  );
}

function fmt(iso: string): string { try { return new Date(iso).toLocaleString(); } catch { return iso; } }
