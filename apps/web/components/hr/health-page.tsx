"use client";

import { useEffect, useState } from "react";
import { HeartPulse, TrendingUp, TrendingDown, Minus, AlertTriangle, Users } from "lucide-react";
import { GlassCard } from "@/components/wellness/glass-card";
import { fetchWithAuth } from "@/lib/client-auth";
import { PageHeader } from "@/components/portal-nav-shell";

interface Aggregate {
  physicalScore: number | null;
  mentalScore: number | null;
  innerCalmScore: number | null;
  lifestyleScore: number | null;
  participationRate: number | null;
  totalEmployees: number;
  departmentCount: number;
  snapshotDate: string | null;
}

interface DeptRow {
  departmentName: string;
  physicalScore: number | null;
  mentalScore: number | null;
  innerCalmScore: number | null;
  lifestyleScore: number | null;
  participationRate: number | null;
  riskBand: string | null;
  employeeCount: number;
}

interface TrendRow {
  date: string;
  physicalScore: number | null;
  mentalScore: number | null;
  innerCalmScore: number | null;
  lifestyleScore: number | null;
  participationRate: number | null;
}

interface HealthData {
  aggregate: Aggregate | null;
  riskCounts: Record<string, number>;
  byDepartment: DeptRow[];
  trendByDate: TrendRow[];
}

const RISK_STYLES: Record<string, string> = {
  low: "bg-[#E6F5EC] text-[#0A6D33]",
  medium: "bg-[#FFF6E0] text-[#9A6A00]",
  high: "bg-[#FFE6D8] text-[#A23F00]",
  critical: "bg-[#FFE6EA] text-[#B42318]",
};

const SCORE_LABELS = [
  { key: "physicalScore", label: "Physical", color: "#167C80" },
  { key: "mentalScore", label: "Mental", color: "#0F6FFF" },
  { key: "innerCalmScore", label: "Inner Calm", color: "#9A6A00" },
  { key: "lifestyleScore", label: "Lifestyle", color: "#56707B" },
] as const;

export function HealthOverviewPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  async function load() {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (dateRange.from) params.set("from", dateRange.from);
      if (dateRange.to) params.set("to", dateRange.to);
      const qs = params.toString();
      const res = await fetchWithAuth<{ data: HealthData }>(`/api/web/hr/health${qs ? `?${qs}` : ""}`);
      setData(res.data);
    } catch {
      setError("Failed to load health data.");
    }
  }

  useEffect(() => { load(); }, []);

  function scoreBar(value: number | null, max = 100) {
    if (value == null) return <span className="text-[#56707B] text-xs">N/A</span>;
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    const color = pct >= 70 ? "#0A6D33" : pct >= 40 ? "#9A6A00" : "#B42318";
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-[#1a3a44] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
        <span className="text-xs font-medium w-10 text-right" style={{ color }}>{value}</span>
      </div>
    );
  }

  function trendIcon(trend: TrendRow[], key: string) {
    if (trend.length < 2) return <Minus className="w-4 h-4 text-[#56707B]" />;
    const recent = (trend[trend.length - 1] as unknown as Record<string, unknown>)[key] as number | null;
    const prev = (trend[trend.length - 2] as unknown as Record<string, unknown>)[key] as number | null;
    if (recent == null || prev == null) return <Minus className="w-4 h-4 text-[#56707B]" />;
    if (recent > prev) return <TrendingUp className="w-4 h-4 text-[#0A6D33]" />;
    if (recent < prev) return <TrendingDown className="w-4 h-4 text-[#B42318]" />;
    return <Minus className="w-4 h-4 text-[#56707B]" />;
  }

  return (
    <>
      <PageHeader title="Organization Health Overview" subtitle="Aggregate wellbeing scores across departments — no employee-level detail." />

      <div className="flex flex-wrap gap-3 mb-6">
        <input type="date" value={dateRange.from} onChange={(e) => setDateRange((p) => ({ ...p, from: e.target.value }))} className="bg-[#10242A] border border-[#56707B]/30 rounded-[14px] px-3 py-2 text-sm text-white" />
        <input type="date" value={dateRange.to} onChange={(e) => setDateRange((p) => ({ ...p, to: e.target.value }))} className="bg-[#10242A] border border-[#56707B]/30 rounded-[14px] px-3 py-2 text-sm text-white" />
        <button onClick={load} className="bg-[#167C80] hover:bg-[#167C80]/80 text-white px-4 py-2 rounded-[14px] text-sm font-medium transition-colors">Apply</button>
      </div>

      {error && <div className="bg-[#FFE6EA]/10 border border-[#B42318]/30 text-[#B42318] rounded-[14px] p-4 mb-6">{error}</div>}

      {data?.aggregate && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {SCORE_LABELS.map(({ key, label, color }) => (
            <GlassCard key={key}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wider text-[#56707B]">{label}</span>
                {trendIcon(data.trendByDate, key)}
              </div>
              <div className="text-2xl font-bold" style={{ color }}>
                {(data.aggregate as unknown as Record<string, unknown>)[key] != null ? String((data.aggregate as unknown as Record<string, unknown>)[key]) : "—"}
              </div>
              {scoreBar((data.aggregate as unknown as Record<string, unknown>)[key] as number | null)}
            </GlassCard>
          ))}
        </div>
      )}

      {data?.aggregate && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <GlassCard>
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-[#167C80]" />
              <span className="text-xs uppercase tracking-wider text-[#56707B]">Total Employees</span>
            </div>
            <div className="text-xl font-bold text-white">{data.aggregate.totalEmployees}</div>
          </GlassCard>
          <GlassCard>
            <div className="flex items-center gap-2 mb-1">
              <HeartPulse className="w-4 h-4 text-[#167C80]" />
              <span className="text-xs uppercase tracking-wider text-[#56707B]">Participation</span>
            </div>
            <div className="text-xl font-bold text-white">
              {data.aggregate.participationRate != null ? `${data.aggregate.participationRate}%` : "—"}
            </div>
          </GlassCard>
          <GlassCard>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-[#9A6A00]" />
              <span className="text-xs uppercase tracking-wider text-[#56707B]">Risk Distribution</span>
            </div>
            <div className="flex gap-2 flex-wrap mt-1">
              {Object.entries(data.riskCounts).map(([band, count]) => (
                <span key={band} className={`px-2 py-0.5 rounded-full text-xs font-medium ${RISK_STYLES[band] ?? "bg-[#1a3a44] text-[#56707B]"}`}>
                  {band}: {count}
                </span>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {data && data.byDepartment.length > 0 && (
        <GlassCard>
          <h3 className="text-sm font-semibold text-white mb-4">Department Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#56707B] text-xs uppercase">
                  <th className="text-left py-2 pr-4">Department</th>
                  <th className="text-right py-2 px-2">Physical</th>
                  <th className="text-right py-2 px-2">Mental</th>
                  <th className="text-right py-2 px-2">Inner Calm</th>
                  <th className="text-right py-2 px-2">Lifestyle</th>
                  <th className="text-right py-2 px-2">Participation</th>
                  <th className="text-center py-2 px-2">Risk</th>
                  <th className="text-right py-2 pl-2">Employees</th>
                </tr>
              </thead>
              <tbody>
                {data.byDepartment.map((d) => (
                  <tr key={d.departmentName} className="border-t border-[#56707B]/10 hover:bg-[#167C80]/5">
                    <td className="py-2 pr-4 font-medium text-white">{d.departmentName}</td>
                    <td className="text-right py-2 px-2">{d.physicalScore ?? "—"}</td>
                    <td className="text-right py-2 px-2">{d.mentalScore ?? "—"}</td>
                    <td className="text-right py-2 px-2">{d.innerCalmScore ?? "—"}</td>
                    <td className="text-right py-2 px-2">{d.lifestyleScore ?? "—"}</td>
                    <td className="text-right py-2 px-2">{d.participationRate != null ? `${d.participationRate}%` : "—"}</td>
                    <td className="text-center py-2 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${RISK_STYLES[d.riskBand ?? ""] ?? "bg-[#1a3a44] text-[#56707B]"}`}>
                        {d.riskBand ?? "—"}
                      </span>
                    </td>
                    <td className="text-right py-2 pl-2">{d.employeeCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {data && data.trendByDate.length > 1 && (
        <GlassCard className="mt-4">
          <h3 className="text-sm font-semibold text-white mb-4">Score Trend (Last {data.trendByDate.length} Snapshots)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#56707B] text-xs uppercase">
                  <th className="text-left py-2 pr-4">Date</th>
                  <th className="text-right py-2 px-2">Physical</th>
                  <th className="text-right py-2 px-2">Mental</th>
                  <th className="text-right py-2 px-2">Inner Calm</th>
                  <th className="text-right py-2 px-2">Lifestyle</th>
                  <th className="text-right py-2 pl-2">Participation</th>
                </tr>
              </thead>
              <tbody>
                {data.trendByDate.map((t) => (
                  <tr key={t.date} className="border-t border-[#56707B]/10">
                    <td className="py-2 pr-4 text-white">{t.date}</td>
                    <td className="text-right py-2 px-2">{t.physicalScore ?? "—"}</td>
                    <td className="text-right py-2 px-2">{t.mentalScore ?? "—"}</td>
                    <td className="text-right py-2 px-2">{t.innerCalmScore ?? "—"}</td>
                    <td className="text-right py-2 px-2">{t.lifestyleScore ?? "—"}</td>
                    <td className="text-right py-2 pl-2">{t.participationRate != null ? `${t.participationRate}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {data && !data.aggregate && (
        <GlassCard>
          <p className="text-[#56707B] text-center py-8">No health data available for the selected period.</p>
        </GlassCard>
      )}
    </>
  );
}
