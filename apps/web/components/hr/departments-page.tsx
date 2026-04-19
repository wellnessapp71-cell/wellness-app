"use client";

import { useEffect, useState } from "react";
import { Building2, TrendingDown, TrendingUp, Minus, GraduationCap, Users } from "lucide-react";
import { GlassCard } from "@/components/wellness/glass-card";
import { fetchWithAuth } from "@/lib/client-auth";
import { PageHeader } from "@/components/portal-nav-shell";

interface HealthSnapshot {
  snapshotDate: string;
  physicalScore: number | null;
  mentalScore: number | null;
  innerCalmScore: number | null;
  lifestyleScore: number | null;
  participationRate: number | null;
  riskBand: string | null;
  employeeCount: number;
}

interface DepartmentRow {
  id: string;
  name: string;
  parentId: string | null;
  employeeCount: number;
  activeTrainings: number;
  health: HealthSnapshot | null;
}

interface TrendRow {
  departmentName: string;
  snapshots: Array<{
    snapshotDate: string;
    physicalScore: number | null;
    mentalScore: number | null;
    innerCalmScore: number | null;
    lifestyleScore: number | null;
    participationRate: number | null;
    riskBand: string | null;
  }>;
}

interface ListResponse {
  departments: DepartmentRow[];
  trends: TrendRow[];
}

const RISK_STYLES: Record<string, string> = {
  low: "bg-[#E6F5EC] text-[#0A6D33]",
  medium: "bg-[#FFF6E0] text-[#9A6A00]",
  high: "bg-[#FFE6D8] text-[#A23F00]",
  critical: "bg-[#FFE6EA] text-[#B42318]",
};

export function DepartmentsDrilldownPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  async function load() {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (dateRange.from) params.set("from", dateRange.from);
      if (dateRange.to) params.set("to", dateRange.to);
      const result = await fetchWithAuth<ListResponse>(`/api/web/hr/departments?${params}`);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load departments.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function findTrend(deptName: string): TrendRow | null {
    return data?.trends.find((t) => t.departmentName === deptName) ?? null;
  }

  return (
    <>
      <PageHeader
        title="Department Drilldown"
        subtitle="Department summary with trend, risk bands, section usage, and assigned trainings."
      />

      <GlassCard className="mb-4 p-4">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">Date range</span>
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange((d) => ({ ...d, from: e.target.value }))}
            className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none"
          />
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange((d) => ({ ...d, to: e.target.value }))}
            className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none"
          />
          <button
            onClick={() => void load()}
            className="rounded-[14px] bg-[#167C80] px-4 py-2 text-xs font-semibold text-white"
          >
            Apply
          </button>
        </div>
      </GlassCard>

      {error ? (
        <div className="mb-4 rounded-[16px] bg-[#FFF5F7] px-4 py-3 text-sm text-[#B42318]">{error}</div>
      ) : null}

      {data && data.departments.length === 0 ? (
        <GlassCard className="p-10 text-center text-sm text-[#56707B]">
          No departments configured for this organization.
        </GlassCard>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data?.departments.map((dept) => {
          const h = dept.health;
          const avg =
            h && h.physicalScore != null
              ? Math.round(
                  ((h.physicalScore ?? 0) +
                    (h.mentalScore ?? 0) +
                    (h.innerCalmScore ?? 0) +
                    (h.lifestyleScore ?? 0)) /
                    4,
                )
              : null;
          const trend = findTrend(dept.name);
          const direction = trendDirection(trend);

          return (
            <button
              key={dept.id}
              onClick={() => setExpanded(expanded === dept.id ? null : dept.id)}
              className="text-left"
            >
              <GlassCard className={`p-5 transition hover:shadow-md ${expanded === dept.id ? "ring-2 ring-[#167C80]/40" : ""}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#167C80]" />
                    <h3 className="text-base font-semibold text-[#10242A]">{dept.name}</h3>
                  </div>
                  {h?.riskBand ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        RISK_STYLES[h.riskBand] ?? "bg-[#F0F0F0] text-[#56707B]"
                      }`}
                    >
                      {h.riskBand} risk
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#56707B]">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" /> {dept.employeeCount} employees
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <GraduationCap className="h-3 w-3" /> {dept.activeTrainings} trainings
                  </span>
                </div>

                {avg != null ? (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="text-2xl font-semibold text-[#10242A]">{avg}</div>
                    <div className="text-xs text-[#56707B]">Avg score</div>
                    <TrendArrow direction={direction} />
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-[#56707B]">No health data available.</p>
                )}

                {h && h.participationRate != null ? (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-[10px] text-[#56707B]">
                      <span>Participation</span>
                      <span>{Math.round(h.participationRate)}%</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-[#E6EEF1]">
                      <div
                        className="h-1.5 rounded-full bg-[#167C80]"
                        style={{ width: `${Math.min(100, h.participationRate)}%` }}
                      />
                    </div>
                  </div>
                ) : null}

                {expanded === dept.id && h ? (
                  <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[#E6EEF1] pt-3">
                    {([
                      ["Physical", h.physicalScore],
                      ["Mental", h.mentalScore],
                      ["Inner calm", h.innerCalmScore],
                      ["Lifestyle", h.lifestyleScore],
                    ] as const).map(([label, score]) => (
                      <div key={label} className="rounded-[12px] bg-[#F4F8F9] p-2 text-center">
                        <p className="text-[10px] font-semibold text-[#56707B]">{label}</p>
                        <p className="text-lg font-semibold text-[#10242A]">{score ?? "—"}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </GlassCard>
            </button>
          );
        })}
      </div>
    </>
  );
}

function trendDirection(trend: TrendRow | null): "up" | "down" | "flat" {
  if (!trend || trend.snapshots.length < 2) return "flat";
  const recent = trend.snapshots[trend.snapshots.length - 1];
  const prev = trend.snapshots[trend.snapshots.length - 2];
  if (!recent || !prev) return "flat";
  const avg = (s: typeof recent) =>
    ((s.physicalScore ?? 0) + (s.mentalScore ?? 0) + (s.innerCalmScore ?? 0) + (s.lifestyleScore ?? 0)) / 4;
  const diff = avg(recent) - avg(prev);
  if (diff > 1) return "up";
  if (diff < -1) return "down";
  return "flat";
}

function TrendArrow({ direction }: { direction: "up" | "down" | "flat" }) {
  if (direction === "up") return <TrendingUp className="h-4 w-4 text-[#0A6D33]" />;
  if (direction === "down") return <TrendingDown className="h-4 w-4 text-[#B42318]" />;
  return <Minus className="h-4 w-4 text-[#56707B]" />;
}
