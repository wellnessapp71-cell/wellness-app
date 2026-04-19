"use client";

import { useEffect, useState } from "react";
import { UserRound, Search, ShieldCheck, Lock, ChevronLeft, ChevronRight } from "lucide-react";
import { GlassCard } from "@/components/wellness/glass-card";
import { fetchWithAuth } from "@/lib/client-auth";
import { PageHeader } from "@/components/portal-nav-shell";

interface ConsentInfo {
  scope: string;
  grantedAt: string;
  expiresAt: string | null;
}

interface EmployeeRow {
  userId: string;
  name: string | null;
  email: string;
  role: string;
  department: string | null;
  joinedAt: string;
  consents: ConsentInfo[];
  approvedAccess: Array<{ scope: unknown; expiresAt: string | null }>;
  hasConsent: boolean;
  hasApprovedAccess: boolean;
}

interface ListResponse {
  employees: EmployeeRow[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export function EmployeeProfilePage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(p = page) {
    try {
      setError(null);
      const params = new URLSearchParams({ page: String(p), limit: "25" });
      if (search) params.set("search", search);
      const res = await fetchWithAuth<{ data: ListResponse }>(`/api/web/hr/employees?${params}`);
      setData(res.data);
    } catch {
      setError("Failed to load employees.");
    }
  }

  useEffect(() => { load(); }, [page]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    load(1);
  }

  return (
    <>
      <PageHeader title="Consent-Gated Employee Profile" subtitle="View employee details only where consent or approved access permits." />

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#56707B]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-[#10242A] border border-[#56707B]/30 rounded-[14px] pl-10 pr-4 py-2 text-sm text-white placeholder:text-[#56707B]"
          />
        </div>
        <button type="submit" className="bg-[#167C80] hover:bg-[#167C80]/80 text-white px-4 py-2 rounded-[14px] text-sm font-medium transition-colors">
          Search
        </button>
      </form>

      {error && <div className="bg-[#FFE6EA]/10 border border-[#B42318]/30 text-[#B42318] rounded-[14px] p-4 mb-6">{error}</div>}

      {data && (
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-[#56707B]">{data.total} employees</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#56707B] text-xs uppercase">
                  <th className="text-left py-2 pr-4">Employee</th>
                  <th className="text-left py-2 px-2">Department</th>
                  <th className="text-center py-2 px-2">Consent</th>
                  <th className="text-center py-2 px-2">Access</th>
                  <th className="text-left py-2 pl-2">Joined</th>
                </tr>
              </thead>
              <tbody>
                {data.employees.map((emp) => (
                  <>
                    <tr
                      key={emp.userId}
                      className="border-t border-[#56707B]/10 hover:bg-[#167C80]/5 cursor-pointer"
                      onClick={() => setExpanded(expanded === emp.userId ? null : emp.userId)}
                    >
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <UserRound className="w-4 h-4 text-[#167C80]" />
                          <div>
                            <div className="font-medium text-white">{emp.name ?? "—"}</div>
                            <div className="text-xs text-[#56707B]">{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-[#56707B]">{emp.department ?? "—"}</td>
                      <td className="text-center py-3 px-2">
                        {emp.hasConsent ? (
                          <ShieldCheck className="w-4 h-4 text-[#0A6D33] inline" />
                        ) : (
                          <Lock className="w-4 h-4 text-[#56707B] inline" />
                        )}
                      </td>
                      <td className="text-center py-3 px-2">
                        {emp.hasApprovedAccess ? (
                          <ShieldCheck className="w-4 h-4 text-[#0A6D33] inline" />
                        ) : (
                          <Lock className="w-4 h-4 text-[#56707B] inline" />
                        )}
                      </td>
                      <td className="py-3 pl-2 text-[#56707B]">{new Date(emp.joinedAt).toLocaleDateString()}</td>
                    </tr>
                    {expanded === emp.userId && (
                      <tr key={`${emp.userId}-detail`}>
                        <td colSpan={5} className="bg-[#10242A]/50 px-4 py-3">
                          {emp.hasConsent || emp.hasApprovedAccess ? (
                            <div className="space-y-2">
                              {emp.consents.length > 0 && (
                                <div>
                                  <span className="text-xs text-[#56707B] uppercase">Active Consents</span>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {emp.consents.map((c, i) => (
                                      <span key={i} className="bg-[#E6F5EC] text-[#0A6D33] px-2 py-0.5 rounded-full text-xs">
                                        {c.scope} — granted {new Date(c.grantedAt).toLocaleDateString()}
                                        {c.expiresAt && ` (expires ${new Date(c.expiresAt).toLocaleDateString()})`}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {emp.approvedAccess.length > 0 && (
                                <div>
                                  <span className="text-xs text-[#56707B] uppercase">Approved Access</span>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {emp.approvedAccess.map((a, i) => (
                                      <span key={i} className="bg-[#EAF4FF] text-[#0F6FFF] px-2 py-0.5 rounded-full text-xs">
                                        {JSON.stringify(a.scope)}
                                        {a.expiresAt && ` (expires ${new Date(a.expiresAt).toLocaleDateString()})`}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-[#56707B] text-xs">No consent or approved access — employee-level detail is restricted.</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
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
