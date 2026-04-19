"use client";

import { useEffect, useState } from "react";
import { BarChart3, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { GlassCard } from "@/components/wellness/glass-card";
import { fetchWithAuth } from "@/lib/client-auth";
import { PageHeader } from "@/components/portal-nav-shell";

interface OrgLite { id: string; name: string }

interface OrgSummary {
  organizationId: string;
  organizationName: string;
  latestPeriodStart: string | null;
  engagementRate: number | null;
  completionRate: number | null;
  engagementTrend: number | null;
  completionTrend: number | null;
  sectionUsage: Record<string, number> | null;
  periods: number;
}

interface BenchmarkRow {
  id: string;
  organizationId: string;
  organization: OrgLite | null;
  departmentName: string | null;
  period: string;
  periodStart: string;
  engagementRate: number | null;
  completionRate: number | null;
  sectionUsage: Record<string, number> | null;
}

export function BenchmarksPage() {
  const [orgSummaries, setOrgSummaries] = useState<OrgSummary[]>([]);
  const [deptBreakdown, setDeptBreakdown] = useState<BenchmarkRow[]>([]);
  const [orgs, setOrgs] = useState<OrgLite[]>([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [period, setPeriod] = useState("monthly");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setError(null);
      const params = new URLSearchParams();
      params.set("period", period);
      if (selectedOrg) params.set("organizationId", selectedOrg);
      const data = await fetchWithAuth<{
        orgSummaries: OrgSummary[];
        departmentBreakdown: BenchmarkRow[];
      }>(`/api/web/admin/benchmarks?${params}`);
      setOrgSummaries(data.orgSummaries);
      setDeptBreakdown(data.departmentBreakdown);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load benchmarks.");
    }
  }

  async function loadOrgs() {
    try {
      const d = await fetchWithAuth<{ organizations: OrgLite[] }>("/api/web/organizations?take=200");
      setOrgs(d.organizations);
    } catch { /* soft fail */ }
  }

  useEffect(() => { void loadOrgs(); }, []);
  useEffect(() => { void load(); }, [selectedOrg, period]);

  return (
    <>
      <PageHeader
        title="Usage Benchmarking"
        subtitle="Compare organizations, departments, and month-over-month engagement trends."
      />

      <GlassCard className="mb-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedOrg}
            onChange={(e) => setSelectedOrg(e.target.value)}
            className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none"
          >
            <option value="">All organizations</option>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none"
          >
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
      </GlassCard>

      {error ? <div className="mb-4 rounded-[16px] bg-[#FFF5F7] px-4 py-3 text-sm text-[#B42318]">{error}</div> : null}

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#56707B]">Organization comparison</h2>
      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {orgSummaries.length === 0 ? (
          <GlassCard className="md:col-span-2 xl:col-span-3 p-10 text-center text-sm text-[#56707B]">
            No benchmark data available.
          </GlassCard>
        ) : null}
        {orgSummaries.map((s) => (
          <GlassCard key={s.organizationId} className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#167C80]" />
                <h3 className="text-sm font-semibold text-[#10242A]">{s.organizationName}</h3>
              </div>
              <span className="text-[10px] text-[#56707B]">{s.periods} periods</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <MetricTile
                label="Engagement"
                value={s.engagementRate != null ? `${Math.round(s.engagementRate)}%` : "—"}
                trend={s.engagementTrend}
              />
              <MetricTile
                label="Completion"
                value={s.completionRate != null ? `${Math.round(s.completionRate)}%` : "—"}
                trend={s.completionTrend}
              />
            </div>
            {s.sectionUsage ? (
              <div className="mt-3 border-t border-[#E6EEF1] pt-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#56707B]">Section usage</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(s.sectionUsage)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .slice(0, 6)
                    .map(([section, count]) => (
                      <span key={section} className="rounded-full bg-[#F4F8F9] px-2 py-0.5 text-[10px] text-[#3A5661]">
                        {section}: {count as number}
                      </span>
                    ))}
                </div>
              </div>
            ) : null}
          </GlassCard>
        ))}
      </div>

      {selectedOrg && deptBreakdown.length > 0 ? (
        <>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#56707B]">Department breakdown</h2>
          <GlassCard className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E6EEF1] text-xs uppercase tracking-wider text-[#56707B]">
                    <th className="px-4 py-3 text-left">Department</th>
                    <th className="px-4 py-3 text-left">Period</th>
                    <th className="px-4 py-3 text-right">Engagement</th>
                    <th className="px-4 py-3 text-right">Completion</th>
                  </tr>
                </thead>
                <tbody>
                  {deptBreakdown.map((b) => (
                    <tr key={b.id} className="border-b border-[#F0F4F5] text-[#17303A]">
                      <td className="px-4 py-2">{b.departmentName ?? "—"}</td>
                      <td className="px-4 py-2 text-xs text-[#56707B]">{fmt(b.periodStart)}</td>
                      <td className="px-4 py-2 text-right font-mono">
                        {b.engagementRate != null ? `${Math.round(b.engagementRate)}%` : "—"}
                      </td>
                      <td className="px-4 py-2 text-right font-mono">
                        {b.completionRate != null ? `${Math.round(b.completionRate)}%` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </>
      ) : null}
    </>
  );
}

function MetricTile({ label, value, trend }: { label: string; value: string; trend: number | null }) {
  return (
    <div className="rounded-[12px] bg-[#F4F8F9] p-3 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#56707B]">{label}</p>
      <div className="mt-1 flex items-center justify-center gap-1.5">
        <span className="text-xl font-semibold text-[#10242A]">{value}</span>
        {trend != null && trend !== 0 ? (
          trend > 0 ? <TrendingUp className="h-3.5 w-3.5 text-[#0A6D33]" /> : <TrendingDown className="h-3.5 w-3.5 text-[#B42318]" />
        ) : <Minus className="h-3.5 w-3.5 text-[#56707B]" />}
      </div>
      {trend != null ? (
        <p className={`text-[10px] ${trend > 0 ? "text-[#0A6D33]" : trend < 0 ? "text-[#B42318]" : "text-[#56707B]"}`}>
          {trend > 0 ? "+" : ""}{Math.round(trend)}pp vs prev
        </p>
      ) : null}
    </div>
  );
}

function fmt(iso: string): string { try { return new Date(iso).toLocaleDateString(); } catch { return iso; } }
