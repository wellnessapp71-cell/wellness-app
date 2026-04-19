"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { GlassCard } from "@/components/wellness/glass-card";
import { fetchWithAuth } from "@/lib/client-auth";
import { PageHeader } from "@/components/portal-nav-shell";

interface ConsentRow {
  id: string;
  employeeUserId: string;
  scope: string;
  purpose: string | null;
  grantedAt: string;
  revokedAt: string | null;
  expiresAt: string | null;
  employee: { id: string; name: string | null; email: string };
}

interface Stats {
  total: number;
  active: number;
  revoked: number;
  expired: number;
  byScope: Record<string, number>;
}

interface ListResponse {
  consents: ConsentRow[];
  stats: Stats;
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const STATUS_FILTERS = ["all", "active", "revoked", "expired"] as const;

export function ConsentStatusPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [scopeFilter, setScopeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  async function load(p = page) {
    try {
      setError(null);
      const params = new URLSearchParams({ page: String(p), limit: "25" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (scopeFilter) params.set("scope", scopeFilter);
      const res = await fetchWithAuth<{ data: ListResponse }>(`/api/web/hr/consent?${params}`);
      setData(res.data);
    } catch {
      setError("Failed to load consent data.");
    }
  }

  useEffect(() => { load(); }, [page, statusFilter, scopeFilter]);

  function consentStatus(c: ConsentRow): { label: string; style: string } {
    if (c.revokedAt) return { label: "Revoked", style: "bg-[#FFE6EA] text-[#B42318]" };
    if (c.expiresAt && new Date(c.expiresAt) <= new Date()) return { label: "Expired", style: "bg-[#FFF6E0] text-[#9A6A00]" };
    return { label: "Active", style: "bg-[#E6F5EC] text-[#0A6D33]" };
  }

  return (
    <>
      <PageHeader title="Consent Status" subtitle="Active consents, approved access scopes, and revocations across your organization." />

      {data?.stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total", value: data.stats.total, color: "#167C80" },
            { label: "Active", value: data.stats.active, color: "#0A6D33" },
            { label: "Revoked", value: data.stats.revoked, color: "#B42318" },
            { label: "Expired", value: data.stats.expired, color: "#9A6A00" },
          ].map((kpi) => (
            <GlassCard key={kpi.label}>
              <span className="text-xs uppercase tracking-wider text-[#56707B]">{kpi.label}</span>
              <div className="text-2xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</div>
            </GlassCard>
          ))}
        </div>
      )}

      {data?.stats && Object.keys(data.stats.byScope).length > 0 && (
        <GlassCard className="mb-6">
          <h3 className="text-sm font-semibold text-white mb-3">Active Consents by Scope</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.stats.byScope).map(([scope, count]) => (
              <button
                key={scope}
                onClick={() => { setScopeFilter(scopeFilter === scope ? "" : scope); setPage(1); }}
                className={`px-3 py-1.5 rounded-[10px] text-xs font-medium transition-colors ${scopeFilter === scope ? "bg-[#167C80] text-white" : "bg-[#1a3a44] text-[#56707B] hover:text-white"}`}
              >
                {scope}: {count}
              </button>
            ))}
          </div>
        </GlassCard>
      )}

      <div className="flex gap-1 bg-[#10242A] rounded-[14px] p-1 mb-6 w-fit">
        {STATUS_FILTERS.map((s) => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className={`px-3 py-1.5 rounded-[10px] text-xs font-medium capitalize transition-colors ${statusFilter === s ? "bg-[#167C80] text-white" : "text-[#56707B] hover:text-white"}`}>
            {s}
          </button>
        ))}
      </div>

      {error && <div className="bg-[#FFE6EA]/10 border border-[#B42318]/30 text-[#B42318] rounded-[14px] p-4 mb-6">{error}</div>}

      {data && (
        <GlassCard>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#56707B] text-xs uppercase">
                  <th className="text-left py-2 pr-4">Employee</th>
                  <th className="text-left py-2 px-2">Scope</th>
                  <th className="text-left py-2 px-2">Purpose</th>
                  <th className="text-center py-2 px-2">Status</th>
                  <th className="text-left py-2 px-2">Granted</th>
                  <th className="text-left py-2 pl-2">Expires</th>
                </tr>
              </thead>
              <tbody>
                {data.consents.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-[#56707B]">No consents found.</td></tr>
                )}
                {data.consents.map((c) => {
                  const st = consentStatus(c);
                  return (
                    <tr key={c.id} className="border-t border-[#56707B]/10 hover:bg-[#167C80]/5">
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-[#167C80]" />
                          <div>
                            <div className="text-white font-medium">{c.employee.name ?? "—"}</div>
                            <div className="text-xs text-[#56707B]">{c.employee.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-2"><span className="bg-[#1a3a44] text-[#56707B] px-2 py-0.5 rounded-full text-xs">{c.scope}</span></td>
                      <td className="py-2 px-2 text-[#56707B] text-xs">{c.purpose ?? "—"}</td>
                      <td className="text-center py-2 px-2"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.style}`}>{st.label}</span></td>
                      <td className="py-2 px-2 text-[#56707B] text-xs">{new Date(c.grantedAt).toLocaleDateString()}</td>
                      <td className="py-2 pl-2 text-[#56707B] text-xs">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "—"}</td>
                    </tr>
                  );
                })}
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
