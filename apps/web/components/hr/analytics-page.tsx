"use client";

import { useEffect, useState } from "react";
import { BarChart3, Users, Activity, Clock } from "lucide-react";
import { GlassCard } from "@/components/wellness/glass-card";
import { fetchWithAuth } from "@/lib/client-auth";
import { PageHeader } from "@/components/portal-nav-shell";

interface TopSection {
  section: string;
  count: number;
  avgDuration: number;
}

interface DailyActive {
  date: string;
  count: number;
}

interface DeptBreakdown {
  department: string;
  totalActions: number;
  topSections: Array<{ section: string; count: number }>;
}

interface AnalyticsData {
  totalActions: number;
  uniqueUsers: number;
  topSections: TopSection[];
  dailyActiveUsers: DailyActive[];
  byDepartment: DeptBreakdown[];
}

export function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [department, setDepartment] = useState("");

  async function load() {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (dateRange.from) params.set("from", dateRange.from);
      if (dateRange.to) params.set("to", dateRange.to);
      if (department) params.set("department", department);
      const qs = params.toString();
      const res = await fetchWithAuth<{ data: AnalyticsData }>(`/api/web/hr/analytics${qs ? `?${qs}` : ""}`);
      setData(res.data);
    } catch {
      setError("Failed to load analytics.");
    }
  }

  useEffect(() => { load(); }, []);

  const maxCount = data ? Math.max(...data.topSections.map((s) => s.count), 1) : 1;

  return (
    <>
      <PageHeader title="Usage Analytics" subtitle="Top-used sections by department — employee-level only with HR-approved consent." />

      <div className="flex flex-wrap gap-3 mb-6">
        <input type="date" value={dateRange.from} onChange={(e) => setDateRange((p) => ({ ...p, from: e.target.value }))} className="bg-[#10242A] border border-[#56707B]/30 rounded-[14px] px-3 py-2 text-sm text-white" />
        <input type="date" value={dateRange.to} onChange={(e) => setDateRange((p) => ({ ...p, to: e.target.value }))} className="bg-[#10242A] border border-[#56707B]/30 rounded-[14px] px-3 py-2 text-sm text-white" />
        <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Department filter" className="bg-[#10242A] border border-[#56707B]/30 rounded-[14px] px-3 py-2 text-sm text-white placeholder:text-[#56707B]" />
        <button onClick={load} className="bg-[#167C80] hover:bg-[#167C80]/80 text-white px-4 py-2 rounded-[14px] text-sm font-medium transition-colors">Apply</button>
      </div>

      {error && <div className="bg-[#FFE6EA]/10 border border-[#B42318]/30 text-[#B42318] rounded-[14px] p-4 mb-6">{error}</div>}

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <GlassCard>
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-[#167C80]" />
                <span className="text-xs uppercase tracking-wider text-[#56707B]">Total Actions</span>
              </div>
              <div className="text-2xl font-bold text-white">{data.totalActions.toLocaleString()}</div>
            </GlassCard>
            <GlassCard>
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-[#0F6FFF]" />
                <span className="text-xs uppercase tracking-wider text-[#56707B]">Unique Users</span>
              </div>
              <div className="text-2xl font-bold text-white">{data.uniqueUsers.toLocaleString()}</div>
            </GlassCard>
            <GlassCard>
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-[#9A6A00]" />
                <span className="text-xs uppercase tracking-wider text-[#56707B]">Departments Active</span>
              </div>
              <div className="text-2xl font-bold text-white">{data.byDepartment.length}</div>
            </GlassCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <GlassCard>
              <h3 className="text-sm font-semibold text-white mb-4">Top Sections</h3>
              <div className="space-y-3">
                {data.topSections.map((s) => (
                  <div key={s.section}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white font-medium">{s.section}</span>
                      <span className="text-[#56707B]">{s.count} actions · avg {s.avgDuration}s</span>
                    </div>
                    <div className="h-2 bg-[#1a3a44] rounded-full overflow-hidden">
                      <div className="h-full bg-[#167C80] rounded-full transition-all" style={{ width: `${(s.count / maxCount) * 100}%` }} />
                    </div>
                  </div>
                ))}
                {data.topSections.length === 0 && <p className="text-[#56707B] text-xs">No usage data available.</p>}
              </div>
            </GlassCard>

            <GlassCard>
              <h3 className="text-sm font-semibold text-white mb-4">Daily Active Users (Last 30 Days)</h3>
              {data.dailyActiveUsers.length > 0 ? (
                <div className="flex items-end gap-1 h-32">
                  {data.dailyActiveUsers.map((d) => {
                    const maxDAU = Math.max(...data.dailyActiveUsers.map((x) => x.count), 1);
                    const pct = (d.count / maxDAU) * 100;
                    return (
                      <div key={d.date} className="flex-1 flex flex-col items-center gap-1" title={`${d.date}: ${d.count} users`}>
                        <div className="w-full bg-[#167C80]/80 rounded-t" style={{ height: `${Math.max(pct, 2)}%` }} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[#56707B] text-xs">No daily active user data.</p>
              )}
              {data.dailyActiveUsers.length > 0 && (
                <div className="flex justify-between text-[10px] text-[#56707B] mt-1">
                  <span>{data.dailyActiveUsers[0]?.date}</span>
                  <span>{data.dailyActiveUsers[data.dailyActiveUsers.length - 1]?.date}</span>
                </div>
              )}
            </GlassCard>
          </div>

          <GlassCard>
            <h3 className="text-sm font-semibold text-white mb-4">Usage by Department</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[#56707B] text-xs uppercase">
                    <th className="text-left py-2 pr-4">Department</th>
                    <th className="text-right py-2 px-2">Total Actions</th>
                    <th className="text-left py-2 pl-2">Top Sections</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byDepartment.map((d) => (
                    <tr key={d.department} className="border-t border-[#56707B]/10">
                      <td className="py-2 pr-4 font-medium text-white">{d.department}</td>
                      <td className="text-right py-2 px-2">{d.totalActions}</td>
                      <td className="py-2 pl-2">
                        <div className="flex flex-wrap gap-1">
                          {d.topSections.map((s) => (
                            <span key={s.section} className="bg-[#1a3a44] text-[#56707B] px-2 py-0.5 rounded-full text-xs">
                              {s.section} ({s.count})
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </>
      )}
    </>
  );
}
