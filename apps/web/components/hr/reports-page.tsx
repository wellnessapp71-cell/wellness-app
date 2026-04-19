"use client";

import { useEffect, useState } from "react";
import { FileText, Plus, X, Download, Clock, CheckCircle2 } from "lucide-react";
import { GlassCard } from "@/components/wellness/glass-card";
import { fetchWithAuth } from "@/lib/client-auth";
import { PageHeader } from "@/components/portal-nav-shell";

interface ReportRow {
  id: string;
  type: string;
  format: string;
  dateRange: { from: string; to: string };
  status: string;
  scheduledEmail: string | null;
  fileUrl: string | null;
  generatedAt: string | null;
  createdAt: string;
}

interface ListResponse {
  reports: ReportRow[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const REPORT_TYPES = ["health_summary", "department_breakdown", "training_progress", "engagement", "compliance"] as const;
const STATUS_STYLES: Record<string, string> = {
  pending: "bg-[#FFF6E0] text-[#9A6A00]",
  processing: "bg-[#EAF4FF] text-[#0F6FFF]",
  completed: "bg-[#E6F5EC] text-[#0A6D33]",
  failed: "bg-[#FFE6EA] text-[#B42318]",
};

export function ReportsPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [typeFilter, setTypeFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    type: "health_summary" as string,
    format: "csv" as string,
    from: "",
    to: "",
    scheduledEmail: "",
  });

  async function load() {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (typeFilter) params.set("type", typeFilter);
      const qs = params.toString();
      const res = await fetchWithAuth<{ data: ListResponse }>(`/api/web/hr/reports${qs ? `?${qs}` : ""}`);
      setData(res.data);
    } catch {
      setError("Failed to load reports.");
    }
  }

  useEffect(() => { load(); }, [typeFilter]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await fetchWithAuth("/api/web/hr/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          format: form.format,
          dateRange: {
            from: new Date(form.from).toISOString(),
            to: new Date(form.to).toISOString(),
          },
          scheduledEmail: form.scheduledEmail || undefined,
        }),
      });
      setShowCreate(false);
      setForm({ type: "health_summary", format: "csv", from: "", to: "", scheduledEmail: "" });
      load();
    } catch {
      setError("Failed to create report request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Reports & Exports" subtitle="Generate PDF and CSV summaries by department — scheduled or on-demand." />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-[#10242A] border border-[#56707B]/30 rounded-[14px] px-3 py-2 text-sm text-white">
          <option value="">All Types</option>
          {REPORT_TYPES.map((t) => (
            <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
          ))}
        </select>
        <button onClick={() => setShowCreate(!showCreate)} className="ml-auto flex items-center gap-1 bg-[#167C80] hover:bg-[#167C80]/80 text-white px-4 py-2 rounded-[14px] text-sm font-medium transition-colors">
          {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreate ? "Cancel" : "New Report"}
        </button>
      </div>

      {error && <div className="bg-[#FFE6EA]/10 border border-[#B42318]/30 text-[#B42318] rounded-[14px] p-4 mb-6">{error}</div>}

      {showCreate && (
        <GlassCard className="mb-6">
          <h3 className="text-sm font-semibold text-white mb-4">Request New Report</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#56707B] mb-1 block">Report Type</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="w-full bg-[#10242A] border border-[#56707B]/30 rounded-[14px] px-3 py-2 text-sm text-white">
                {REPORT_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#56707B] mb-1 block">Format</label>
              <select value={form.format} onChange={(e) => setForm((f) => ({ ...f, format: e.target.value }))} className="w-full bg-[#10242A] border border-[#56707B]/30 rounded-[14px] px-3 py-2 text-sm text-white">
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[#56707B] mb-1 block">From Date</label>
              <input type="date" required value={form.from} onChange={(e) => setForm((f) => ({ ...f, from: e.target.value }))} className="w-full bg-[#10242A] border border-[#56707B]/30 rounded-[14px] px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-[#56707B] mb-1 block">To Date</label>
              <input type="date" required value={form.to} onChange={(e) => setForm((f) => ({ ...f, to: e.target.value }))} className="w-full bg-[#10242A] border border-[#56707B]/30 rounded-[14px] px-3 py-2 text-sm text-white" />
            </div>
            <div className="col-span-full">
              <label className="text-xs text-[#56707B] mb-1 block">Email delivery (optional)</label>
              <input type="email" value={form.scheduledEmail} onChange={(e) => setForm((f) => ({ ...f, scheduledEmail: e.target.value }))} placeholder="email@company.com" className="w-full bg-[#10242A] border border-[#56707B]/30 rounded-[14px] px-3 py-2 text-sm text-white placeholder:text-[#56707B]" />
            </div>
            <div className="col-span-full flex justify-end">
              <button type="submit" disabled={busy} className="flex items-center gap-1 bg-[#167C80] hover:bg-[#167C80]/80 text-white px-4 py-2 rounded-[14px] text-sm font-medium transition-colors disabled:opacity-50">
                <FileText className="w-4 h-4" /> Request Report
              </button>
            </div>
          </form>
        </GlassCard>
      )}

      {data && (
        <div className="space-y-3">
          {data.reports.length === 0 && (
            <GlassCard><p className="text-[#56707B] text-center py-8">No reports found.</p></GlassCard>
          )}
          {data.reports.map((r) => (
            <GlassCard key={r.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[#167C80] shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white capitalize">{r.type.replace(/_/g, " ")}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[r.status] ?? "bg-[#1a3a44] text-[#56707B]"}`}>{r.status}</span>
                      <span className="bg-[#1a3a44] text-[#56707B] px-2 py-0.5 rounded-full text-xs uppercase">{r.format}</span>
                    </div>
                    <div className="text-xs text-[#56707B] mt-1 flex gap-3">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(r.createdAt).toLocaleDateString()}</span>
                      <span>Range: {new Date(r.dateRange.from).toLocaleDateString()} – {new Date(r.dateRange.to).toLocaleDateString()}</span>
                      {r.scheduledEmail && <span>Email: {r.scheduledEmail}</span>}
                    </div>
                  </div>
                </div>
                {r.status === "completed" && r.fileUrl && (
                  <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#167C80] hover:text-white text-sm transition-colors">
                    <Download className="w-4 h-4" /> Download
                  </a>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </>
  );
}
