"use client";

import { useEffect, useState } from "react";
import { Activity, Plus, AlertTriangle, CheckCircle2, X, ExternalLink } from "lucide-react";
import { GlassCard } from "@/components/wellness/glass-card";
import { fetchWithAuth } from "@/lib/client-auth";
import { PageHeader } from "@/components/portal-nav-shell";

interface IncidentRow {
  id: string;
  title: string;
  module: string;
  severity: "minor" | "major" | "critical";
  status: "investigating" | "identified" | "monitoring" | "resolved";
  startTime: string;
  resolvedAt: string | null;
  affectedOrgId: string | null;
  organization: { id: string; name: string } | null;
  alertChannel: string | null;
  postmortemUrl: string | null;
  timeline: Array<{ ts: string; actorUserId: string | null; status?: string; severity?: string; note?: string; resolved?: boolean }> | null;
  owner: { id: string; name: string | null; email: string } | null;
  createdAt: string;
}

interface OrgLite {
  id: string;
  name: string;
}

const STATE_STYLES = {
  online: { label: "Online", color: "bg-[#E6F5EC] text-[#0A6D33]" },
  degraded: { label: "Degraded", color: "bg-[#FFF6E0] text-[#9A6A00]" },
  partial_outage: { label: "Partial outage", color: "bg-[#FFE6D8] text-[#A23F00]" },
  outage: { label: "Outage", color: "bg-[#FFE6EA] text-[#B42318]" },
} as const;

type ModuleState = keyof typeof STATE_STYLES;

export function IncidentsPage() {
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [moduleStates, setModuleStates] = useState<Array<{ module: string; state: ModuleState }>>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [orgs, setOrgs] = useState<OrgLite[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [activeIncident, setActiveIncident] = useState<IncidentRow | null>(null);

  async function load() {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const data = await fetchWithAuth<{ incidents: IncidentRow[]; moduleStates: Array<{ module: string; state: ModuleState }> }>(
        `/api/web/admin/incidents?${params}`,
      );
      setIncidents(data.incidents);
      setModuleStates(data.moduleStates);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load incidents.");
    }
  }

  async function loadOrgs() {
    try {
      const data = await fetchWithAuth<{ organizations: OrgLite[] }>("/api/web/organizations?take=200");
      setOrgs(data.organizations);
    } catch {
      // soft fail
    }
  }

  useEffect(() => {
    void load();
  }, [statusFilter]);

  useEffect(() => {
    void loadOrgs();
  }, []);

  return (
    <>
      <PageHeader
        title="App Health & Incident Monitor"
        subtitle="Module status, open incidents, and timelines. Open incidents drive the heatmap."
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[#10242A] px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            New incident
          </button>
        }
      />

      <GlassCard className="mb-4 p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#56707B]">Module health</h2>
        {moduleStates.length === 0 ? (
          <p className="text-sm text-[#0A6D33]">All systems online.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {moduleStates.map((m) => (
              <span
                key={m.module}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${STATE_STYLES[m.state].color}`}
              >
                <span className="h-2 w-2 rounded-full bg-current opacity-70" />
                {m.module} — {STATE_STYLES[m.state].label}
              </span>
            ))}
          </div>
        )}
      </GlassCard>

      {showCreate ? (
        <CreateIncidentForm
          orgs={orgs}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            void load();
          }}
        />
      ) : null}

      <GlassCard className="mb-4 p-3">
        <div className="flex flex-wrap gap-2">
          {["all", "investigating", "identified", "monitoring", "resolved"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                statusFilter === s ? "bg-[#10242A] text-white" : "border border-[#D7E3E7] text-[#3A5661]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </GlassCard>

      {error ? <div className="mb-4 rounded-[16px] bg-[#FFF5F7] px-4 py-3 text-sm text-[#B42318]">{error}</div> : null}

      <div className="space-y-3">
        {incidents.length === 0 ? (
          <GlassCard className="p-10 text-center text-sm text-[#56707B]">No incidents.</GlassCard>
        ) : null}
        {incidents.map((inc) => (
          <IncidentCard
            key={inc.id}
            incident={inc}
            onOpen={() => setActiveIncident(inc)}
          />
        ))}
      </div>

      {activeIncident ? (
        <IncidentDetail
          incident={activeIncident}
          onClose={() => setActiveIncident(null)}
          onUpdated={() => {
            setActiveIncident(null);
            void load();
          }}
        />
      ) : null}
    </>
  );
}

function IncidentCard({ incident, onOpen }: { incident: IncidentRow; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="block w-full text-left"
    >
      <GlassCard className={`p-5 transition hover:shadow-md ${severityBorder(incident.severity)}`}>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {incident.status === "resolved" ? (
                <CheckCircle2 className="h-4 w-4 text-[#0A6D33]" />
              ) : (
                <Activity className="h-4 w-4 text-[#B42318]" />
              )}
              <h3 className="text-base font-semibold text-[#10242A]">{incident.title}</h3>
              <SeverityBadge severity={incident.severity} />
              <StatusBadge status={incident.status} />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#56707B]">
              <span>Module: <span className="font-mono text-[#10242A]">{incident.module}</span></span>
              <span>Started: {fmt(incident.startTime)}</span>
              {incident.resolvedAt ? <span>Resolved: {fmt(incident.resolvedAt)}</span> : null}
              {incident.organization ? <span>Org: {incident.organization.name}</span> : null}
              {incident.owner ? <span>Owner: {incident.owner.email}</span> : null}
            </div>
          </div>
        </div>
      </GlassCard>
    </button>
  );
}

function severityBorder(s: string): string {
  if (s === "critical") return "border-l-4 border-l-[#B42318]";
  if (s === "major") return "border-l-4 border-l-[#A23F00]";
  return "border-l-4 border-l-[#9A6A00]";
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    critical: "bg-[#FFE6EA] text-[#B42318]",
    major: "bg-[#FFE6D8] text-[#A23F00]",
    minor: "bg-[#FFF6E0] text-[#9A6A00]",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${styles[severity] ?? ""}`}>
      {severity}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    investigating: "bg-[#FFE6EA] text-[#B42318]",
    identified: "bg-[#FFE6D8] text-[#A23F00]",
    monitoring: "bg-[#EAF4FF] text-[#0F6FFF]",
    resolved: "bg-[#E6F5EC] text-[#0A6D33]",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${styles[status] ?? ""}`}>
      {status}
    </span>
  );
}

function fmt(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function CreateIncidentForm({ orgs, onClose, onCreated }: { orgs: OrgLite[]; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    title: "",
    module: "",
    severity: "minor" as "minor" | "major" | "critical",
    status: "investigating" as "investigating" | "identified" | "monitoring" | "resolved",
    affectedOrgId: "",
    alertChannel: "",
    postmortemUrl: "",
    initialNote: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.module.trim()) {
      setError("Title and module are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        module: form.module.trim(),
        severity: form.severity,
        status: form.status,
      };
      if (form.affectedOrgId) payload.affectedOrgId = form.affectedOrgId;
      if (form.alertChannel.trim()) payload.alertChannel = form.alertChannel.trim();
      if (form.postmortemUrl.trim()) payload.postmortemUrl = form.postmortemUrl.trim();
      if (form.initialNote.trim()) payload.initialNote = form.initialNote.trim();

      await fetchWithAuth("/api/web/admin/incidents", { method: "POST", body: JSON.stringify(payload) });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to open incident.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <GlassCard className="mb-4 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#10242A]">Open new incident</h2>
        <button onClick={onClose} className="text-[#56707B]">
          <X className="h-4 w-4" />
        </button>
      </div>
      <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
        <label className="md:col-span-2 flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">Title *</span>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">Module * (e.g. mobile-app, auth, api)</span>
          <input
            value={form.module}
            onChange={(e) => setForm((f) => ({ ...f, module: e.target.value }))}
            className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">Severity</span>
          <select
            value={form.severity}
            onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value as typeof form.severity }))}
            className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none"
          >
            <option value="minor">Minor</option>
            <option value="major">Major</option>
            <option value="critical">Critical</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">Status</span>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as typeof form.status }))}
            className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none"
          >
            <option value="investigating">Investigating</option>
            <option value="identified">Identified</option>
            <option value="monitoring">Monitoring</option>
            <option value="resolved">Resolved</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">Affected org (optional)</span>
          <select
            value={form.affectedOrgId}
            onChange={(e) => setForm((f) => ({ ...f, affectedOrgId: e.target.value }))}
            className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none"
          >
            <option value="">Platform-wide</option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">Alert channel (e.g. #incidents)</span>
          <input
            value={form.alertChannel}
            onChange={(e) => setForm((f) => ({ ...f, alertChannel: e.target.value }))}
            className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none"
          />
        </label>
        <label className="md:col-span-2 flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">Postmortem URL</span>
          <input
            type="url"
            value={form.postmortemUrl}
            onChange={(e) => setForm((f) => ({ ...f, postmortemUrl: e.target.value }))}
            className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none"
          />
        </label>
        <label className="md:col-span-2 flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">Initial note</span>
          <textarea
            value={form.initialNote}
            onChange={(e) => setForm((f) => ({ ...f, initialNote: e.target.value }))}
            rows={3}
            className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none"
          />
        </label>
        {error ? <div className="md:col-span-2 rounded-[14px] bg-[#FFF5F7] px-3 py-2 text-sm text-[#B42318]">{error}</div> : null}
        <div className="md:col-span-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full border border-[#D7E3E7] px-4 py-2 text-sm font-semibold">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-[#10242A] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Opening…" : "Open incident"}
          </button>
        </div>
      </form>
    </GlassCard>
  );
}

function IncidentDetail({
  incident,
  onClose,
  onUpdated,
}: {
  incident: IncidentRow;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [status, setStatus] = useState(incident.status);
  const [severity, setSeverity] = useState(incident.severity);
  const [note, setNote] = useState("");
  const [postmortemUrl, setPostmortemUrl] = useState(incident.postmortemUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {};
      if (status !== incident.status) payload.status = status;
      if (severity !== incident.severity) payload.severity = severity;
      if (note.trim()) payload.note = note.trim();
      if (postmortemUrl.trim() !== (incident.postmortemUrl ?? "")) {
        payload.postmortemUrl = postmortemUrl.trim() || null;
      }
      if (Object.keys(payload).length === 0) {
        onClose();
        return;
      }
      await fetchWithAuth(`/api/web/admin/incidents/${incident.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  }

  const timeline = incident.timeline ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-[28px] bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-[#10242A]">{incident.title}</h2>
              <SeverityBadge severity={incident.severity} />
              <StatusBadge status={incident.status} />
            </div>
            <p className="mt-1 text-xs text-[#56707B]">
              Module {incident.module} • Started {fmt(incident.startTime)}
              {incident.organization ? ` • ${incident.organization.name}` : ""}
            </p>
          </div>
          <button onClick={onClose} className="text-[#56707B]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm"
            >
              <option value="investigating">Investigating</option>
              <option value="identified">Identified</option>
              <option value="monitoring">Monitoring</option>
              <option value="resolved">Resolved</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">Severity</span>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as typeof severity)}
              className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm"
            >
              <option value="minor">Minor</option>
              <option value="major">Major</option>
              <option value="critical">Critical</option>
            </select>
          </label>
          <label className="md:col-span-2 flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">Postmortem URL</span>
            <input
              type="url"
              value={postmortemUrl}
              onChange={(e) => setPostmortemUrl(e.target.value)}
              className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="md:col-span-2 flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">Add timeline note</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="What's the latest update? (logged with your action)"
              className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm"
            />
          </label>
        </div>

        {error ? <div className="mt-3 rounded-[14px] bg-[#FFF5F7] px-3 py-2 text-sm text-[#B42318]">{error}</div> : null}

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-full border border-[#D7E3E7] px-4 py-2 text-sm font-semibold">
            Close
          </button>
          <button
            disabled={saving}
            onClick={() => void save()}
            className="rounded-full bg-[#10242A] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save update"}
          </button>
        </div>

        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#56707B]">Timeline</h3>
          {incident.postmortemUrl ? (
            <a
              href={incident.postmortemUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-[#167C80] hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Postmortem
            </a>
          ) : null}
          <div className="space-y-2">
            {timeline.length === 0 ? (
              <p className="text-xs text-[#56707B]">No entries yet.</p>
            ) : (
              timeline.map((entry, i) => (
                <div key={i} className="rounded-[12px] border border-[#E6EEF1] bg-[#F8FBFC] p-3 text-xs">
                  <div className="flex items-center gap-2 text-[#56707B]">
                    <span>{fmt(entry.ts)}</span>
                    {entry.status ? <StatusBadge status={entry.status} /> : null}
                    {entry.severity ? <SeverityBadge severity={entry.severity} /> : null}
                    {entry.resolved ? (
                      <span className="rounded-full bg-[#E6F5EC] px-2 py-0.5 text-[10px] font-semibold uppercase text-[#0A6D33]">
                        Resolved
                      </span>
                    ) : null}
                  </div>
                  {entry.note ? <p className="mt-1 text-[#3A5661]">{entry.note}</p> : null}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
