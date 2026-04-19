"use client";

import { useEffect, useState } from "react";
import { Trash2, Plus, ShieldCheck, X } from "lucide-react";
import { GlassCard } from "@/components/wellness/glass-card";
import { fetchWithAuth } from "@/lib/client-auth";
import { PageHeader } from "@/components/portal-nav-shell";

interface OrgLite { id: string; name: string }

interface PolicyRow {
  id: string;
  organizationId: string | null;
  organization: OrgLite | null;
  dataType: string;
  retentionDays: number;
  action: string;
  enabled: boolean;
  notes: string | null;
  createdAt: string;
}

interface DeletionRow {
  id: string;
  organizationId: string | null;
  organization: OrgLite | null;
  subjectUserId: string | null;
  requestType: string;
  scope: unknown;
  status: string;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  requester: { id: string; name: string | null; email: string } | null;
}

export function RetentionPage() {
  const [view, setView] = useState<"policies" | "deletions">("policies");
  const [policies, setPolicies] = useState<PolicyRow[]>([]);
  const [deletions, setDeletions] = useState<DeletionRow[]>([]);
  const [orgs, setOrgs] = useState<OrgLite[]>([]);
  const [showPolicyForm, setShowPolicyForm] = useState(false);
  const [showDeletionForm, setShowDeletionForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadPolicies() {
    try { setError(null); const data = await fetchWithAuth<{ policies: PolicyRow[] }>("/api/web/admin/retention"); setPolicies(data.policies); } catch (err) { setError(err instanceof Error ? err.message : "Failed."); }
  }
  async function loadDeletions() {
    try { setError(null); const data = await fetchWithAuth<{ deletions: DeletionRow[] }>("/api/web/admin/retention?view=deletions"); setDeletions(data.deletions); } catch (err) { setError(err instanceof Error ? err.message : "Failed."); }
  }
  async function loadOrgs() {
    try { const d = await fetchWithAuth<{ organizations: OrgLite[] }>("/api/web/organizations?take=200"); setOrgs(d.organizations); } catch { /* soft fail */ }
  }

  useEffect(() => { void loadPolicies(); void loadDeletions(); void loadOrgs(); }, []);

  return (
    <>
      <PageHeader
        title="Retention & Deletion Center"
        subtitle="Configure data retention windows and process deletion or anonymization requests."
        actions={
          <div className="flex gap-2">
            <button onClick={() => setShowPolicyForm(true)} className="inline-flex items-center gap-2 rounded-full bg-[#10242A] px-4 py-2 text-sm font-semibold text-white">
              <ShieldCheck className="h-4 w-4" /> New policy
            </button>
            <button onClick={() => setShowDeletionForm(true)} className="inline-flex items-center gap-2 rounded-full border border-[#F1D2D9] px-4 py-2 text-sm font-semibold text-[#B42318]">
              <Trash2 className="h-4 w-4" /> Deletion request
            </button>
          </div>
        }
      />

      {showPolicyForm ? <PolicyForm orgs={orgs} onClose={() => setShowPolicyForm(false)} onCreated={() => { setShowPolicyForm(false); void loadPolicies(); }} /> : null}
      {showDeletionForm ? <DeletionForm orgs={orgs} onClose={() => setShowDeletionForm(false)} onCreated={() => { setShowDeletionForm(false); void loadDeletions(); }} /> : null}

      <GlassCard className="mb-4 p-3">
        <div className="flex gap-2">
          {(["policies", "deletions"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize ${view === v ? "bg-[#10242A] text-white" : "border border-[#D7E3E7] text-[#3A5661]"}`}>
              {v}
            </button>
          ))}
        </div>
      </GlassCard>

      {error ? <div className="mb-4 rounded-[16px] bg-[#FFF5F7] px-4 py-3 text-sm text-[#B42318]">{error}</div> : null}

      {view === "policies" ? (
        <div className="space-y-3">
          {policies.length === 0 ? <GlassCard className="p-10 text-center text-sm text-[#56707B]">No retention policies configured.</GlassCard> : null}
          {policies.map((p) => (
            <GlassCard key={p.id} className="p-5">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#167C80]" />
                    <h3 className="font-semibold text-[#10242A]">{p.dataType}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${p.enabled ? "bg-[#E6F5EC] text-[#0A6D33]" : "bg-[#F0F0F0] text-[#56707B]"}`}>
                      {p.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#56707B]">
                    Retain {p.retentionDays} days • Action: {p.action} • Org: {p.organization?.name ?? "Platform-wide"}
                  </p>
                  {p.notes ? <p className="mt-1 text-xs text-[#3A5661]">{p.notes}</p> : null}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {deletions.length === 0 ? <GlassCard className="p-10 text-center text-sm text-[#56707B]">No deletion requests.</GlassCard> : null}
          {deletions.map((d) => (
            <GlassCard key={d.id} className="p-5">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4 text-[#B42318]" />
                    <h3 className="text-sm font-semibold capitalize text-[#10242A]">{d.requestType} request</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      d.status === "completed" ? "bg-[#E6F5EC] text-[#0A6D33]" : d.status === "pending" ? "bg-[#FFF6E0] text-[#9A6A00]" : "bg-[#EAF4FF] text-[#0F6FFF]"
                    }`}>
                      {d.status}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#56707B]">
                    {d.organization ? <span>Org: {d.organization.name}</span> : null}
                    {d.subjectUserId ? <span>Subject: {d.subjectUserId.slice(0, 10)}…</span> : null}
                    <span>By: {d.requester?.email ?? "—"}</span>
                    <span>Created: {fmt(d.createdAt)}</span>
                    {d.completedAt ? <span>Completed: {fmt(d.completedAt)}</span> : null}
                  </div>
                  {d.notes ? <p className="mt-1 text-xs text-[#3A5661]">{d.notes}</p> : null}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </>
  );
}

function PolicyForm({ orgs, onClose, onCreated }: { orgs: OrgLite[]; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ dataType: "", retentionDays: "90", action: "delete", organizationId: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.dataType.trim()) { setError("Data type required."); return; }
    setSubmitting(true); setError(null);
    try {
      await fetchWithAuth("/api/web/admin/retention", { method: "POST", body: JSON.stringify({
        dataType: form.dataType.trim(), retentionDays: Number(form.retentionDays), action: form.action,
        organizationId: form.organizationId || null, notes: form.notes.trim() || undefined, enabled: true,
      }) });
      onCreated();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed."); } finally { setSubmitting(false); }
  }

  return (
    <GlassCard className="mb-4 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#10242A]">New retention policy</h2>
        <button onClick={onClose} className="text-[#56707B]"><X className="h-4 w-4" /></button>
      </div>
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">Data type *</span>
          <input value={form.dataType} onChange={(e) => setForm((f) => ({ ...f, dataType: e.target.value }))} placeholder="e.g. click_logs, complaints" className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">Retention days *</span>
          <input type="number" value={form.retentionDays} onChange={(e) => setForm((f) => ({ ...f, retentionDays: e.target.value }))} className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">Action</span>
          <select value={form.action} onChange={(e) => setForm((f) => ({ ...f, action: e.target.value }))} className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none">
            <option value="delete">Delete</option>
            <option value="anonymize">Anonymize</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">Organization (optional)</span>
          <select value={form.organizationId} onChange={(e) => setForm((f) => ({ ...f, organizationId: e.target.value }))} className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none">
            <option value="">Platform-wide</option>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </label>
        <label className="md:col-span-2 flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">Notes</span>
          <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none" />
        </label>
        {error ? <div className="md:col-span-2 rounded-[14px] bg-[#FFF5F7] px-3 py-2 text-sm text-[#B42318]">{error}</div> : null}
        <div className="md:col-span-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full border border-[#D7E3E7] px-4 py-2 text-sm font-semibold">Cancel</button>
          <button type="submit" disabled={submitting} className="rounded-full bg-[#10242A] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{submitting ? "Saving…" : "Save policy"}</button>
        </div>
      </form>
    </GlassCard>
  );
}

function DeletionForm({ orgs, onClose, onCreated }: { orgs: OrgLite[]; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ requestType: "manual", organizationId: "", subjectUserId: "", notes: "", scopeDesc: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setError(null);
    try {
      await fetchWithAuth("/api/web/admin/retention?action=deletion", { method: "POST", body: JSON.stringify({
        requestType: form.requestType,
        organizationId: form.organizationId || null,
        subjectUserId: form.subjectUserId.trim() || null,
        scope: { description: form.scopeDesc.trim() },
        notes: form.notes.trim() || undefined,
      }) });
      onCreated();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed."); } finally { setSubmitting(false); }
  }

  return (
    <GlassCard className="mb-4 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#10242A]">New deletion request</h2>
        <button onClick={onClose} className="text-[#56707B]"><X className="h-4 w-4" /></button>
      </div>
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">Request type</span>
          <select value={form.requestType} onChange={(e) => setForm((f) => ({ ...f, requestType: e.target.value }))} className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none">
            <option value="manual">Manual</option>
            <option value="gdpr">GDPR</option>
            <option value="legal">Legal</option>
            <option value="policy">Policy</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">Organization (optional)</span>
          <select value={form.organizationId} onChange={(e) => setForm((f) => ({ ...f, organizationId: e.target.value }))} className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none">
            <option value="">None</option>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">Subject user ID (optional)</span>
          <input value={form.subjectUserId} onChange={(e) => setForm((f) => ({ ...f, subjectUserId: e.target.value }))} className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">Scope description</span>
          <input value={form.scopeDesc} onChange={(e) => setForm((f) => ({ ...f, scopeDesc: e.target.value }))} placeholder="e.g. all personal data, click logs only" className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none" />
        </label>
        <label className="md:col-span-2 flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">Notes</span>
          <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none" />
        </label>
        {error ? <div className="md:col-span-2 rounded-[14px] bg-[#FFF5F7] px-3 py-2 text-sm text-[#B42318]">{error}</div> : null}
        <div className="md:col-span-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full border border-[#D7E3E7] px-4 py-2 text-sm font-semibold">Cancel</button>
          <button type="submit" disabled={submitting} className="rounded-full bg-[#B42318] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{submitting ? "Submitting…" : "Submit request"}</button>
        </div>
      </form>
    </GlassCard>
  );
}

function fmt(iso: string): string { try { return new Date(iso).toLocaleString(); } catch { return iso; } }
