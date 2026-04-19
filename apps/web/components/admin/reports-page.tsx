"use client";

import { useEffect, useState } from "react";
import { FileText, Plus, X, Download } from "lucide-react";
import { GlassCard } from "@/components/wellness/glass-card";
import { fetchWithAuth } from "@/lib/client-auth";
import { PageHeader } from "@/components/portal-nav-shell";

interface OrgLite { id: string; name: string }

interface ReportRow {
  id: string;
  type: string;
  dateRange: { from?: string; to?: string; organizationId?: string; departmentId?: string };
  format: string;
  status: string;
  scheduledEmail: string | null;
  fileUrl: string | null;
  generatedAt: string | null;
  createdAt: string;
  requestedBy: { id: string; name: string | null; email: string } | null;
}

const REPORT_TYPES = [
  "department", "access", "complaint", "incident", "professional_utilization", "engagement",
] as const;

export function ReportsPage() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [orgs, setOrgs] = useState<OrgLite[]>([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      const data = await fetchWithAuth<{ reports: ReportRow[] }>(`/api/web/admin/reports?${params}`);
      setReports(data.reports);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load reports.");
    }
  }

  async function loadOrgs() {
    try {
      const data = await fetchWithAuth<{ organizations: OrgLite[] }>("/api/web/organizations?take=200");
      setOrgs(data.organizations);
    } catch { /* soft fail */ }
  }

  useEffect(() => { void load(); void loadOrgs(); }, []);
  useEffect(() => { void load(); }, [typeFilter]);

  return (
    <>
      <PageHeader
        title="Reports & Exports"
        subtitle="Generate and schedule department, access, complaint, incident, and engagement reports."
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[#10242A] px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" /> New report
          </button>
        }
      />

      {showCreate ? (
        <CreateReportForm
          orgs={orgs}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); void load(); }}
        />
      ) : null}

      <GlassCard className="mb-4 p-3">
        <div className="flex flex-wrap gap-2">
          {["all", ...REPORT_TYPES].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                typeFilter === t ? "bg-[#10242A] text-white" : "border border-[#D7E3E7] text-[#3A5661]"
              }`}
            >
              {t.replace("_", " ")}
            </button>
          ))}
        </div>
      </GlassCard>

      {error ? <div className="mb-4 rounded-[16px] bg-[#FFF5F7] px-4 py-3 text-sm text-[#B42318]">{error}</div> : null}

      <div className="space-y-3">
        {reports.length === 0 ? (
          <GlassCard className="p-10 text-center text-sm text-[#56707B]">No reports yet.</GlassCard>
        ) : null}
        {reports.map((r) => (
          <GlassCard key={r.id} className="p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#167C80]" />
                  <h3 className="text-sm font-semibold capitalize text-[#10242A]">{r.type.replace("_", " ")} report</h3>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    r.status === "ready" ? "bg-[#E6F5EC] text-[#0A6D33]"
                    : r.status === "generating" ? "bg-[#FFF6E0] text-[#9A6A00]"
                    : "bg-[#F0F0F0] text-[#56707B]"
                  }`}>
                    {r.status}
                  </span>
                  <span className="rounded-full border border-[#D7E3E7] px-2 py-0.5 text-[10px] font-semibold uppercase text-[#56707B]">
                    {r.format}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#56707B]">
                  {r.dateRange?.from ? <span>From: {r.dateRange.from.slice(0, 10)}</span> : null}
                  {r.dateRange?.to ? <span>To: {r.dateRange.to.slice(0, 10)}</span> : null}
                  {r.requestedBy ? <span>By: {r.requestedBy.email}</span> : null}
                  {r.scheduledEmail ? <span>Deliver to: {r.scheduledEmail}</span> : null}
                  <span>Created: {fmt(r.createdAt)}</span>
                </div>
              </div>
              {r.fileUrl ? (
                <a
                  href={r.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#167C80] px-3 py-1.5 text-xs font-semibold text-white"
                >
                  <Download className="h-3 w-3" /> Download
                </a>
              ) : null}
            </div>
          </GlassCard>
        ))}
      </div>
    </>
  );
}

function CreateReportForm({ orgs, onClose, onCreated }: { orgs: OrgLite[]; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    type: "department" as (typeof REPORT_TYPES)[number],
    dateRangeFrom: defaultDateFrom(),
    dateRangeTo: today(),
    organizationId: "",
    format: "csv" as "csv" | "pdf",
    scheduledEmail: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        type: form.type,
        dateRangeFrom: new Date(form.dateRangeFrom).toISOString(),
        dateRangeTo: new Date(form.dateRangeTo).toISOString(),
        format: form.format,
      };
      if (form.organizationId) payload.organizationId = form.organizationId;
      if (form.scheduledEmail.trim()) payload.scheduledEmail = form.scheduledEmail.trim();
      await fetchWithAuth("/api/web/admin/reports", { method: "POST", body: JSON.stringify(payload) });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create report.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <GlassCard className="mb-4 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#10242A]">Generate report</h2>
        <button onClick={onClose} className="text-[#56707B]"><X className="h-4 w-4" /></button>
      </div>
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">Report type</span>
          <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as typeof form.type }))}
            className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none">
            {REPORT_TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">Format</span>
          <select value={form.format} onChange={(e) => setForm((f) => ({ ...f, format: e.target.value as typeof form.format }))}
            className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none">
            <option value="csv">CSV</option>
            <option value="pdf">PDF</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">From</span>
          <input type="date" value={form.dateRangeFrom} onChange={(e) => setForm((f) => ({ ...f, dateRangeFrom: e.target.value }))}
            className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">To</span>
          <input type="date" value={form.dateRangeTo} onChange={(e) => setForm((f) => ({ ...f, dateRangeTo: e.target.value }))}
            className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">Organization (optional)</span>
          <select value={form.organizationId} onChange={(e) => setForm((f) => ({ ...f, organizationId: e.target.value }))}
            className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none">
            <option value="">All</option>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">Email delivery (optional)</span>
          <input type="email" value={form.scheduledEmail} onChange={(e) => setForm((f) => ({ ...f, scheduledEmail: e.target.value }))}
            placeholder="email@example.com"
            className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none" />
        </label>
        {error ? <div className="md:col-span-2 rounded-[14px] bg-[#FFF5F7] px-3 py-2 text-sm text-[#B42318]">{error}</div> : null}
        <div className="md:col-span-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full border border-[#D7E3E7] px-4 py-2 text-sm font-semibold">Cancel</button>
          <button type="submit" disabled={submitting}
            className="rounded-full bg-[#10242A] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {submitting ? "Generating…" : "Generate"}
          </button>
        </div>
      </form>
    </GlassCard>
  );
}

function fmt(iso: string): string { try { return new Date(iso).toLocaleString(); } catch { return iso; } }
function today(): string { return new Date().toISOString().slice(0, 10); }
function defaultDateFrom(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 10);
}
