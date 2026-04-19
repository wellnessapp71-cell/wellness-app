"use client";

import { useEffect, useMemo, useState } from "react";
import { BellRing, Plus, AlertTriangle, X, PauseCircle, StopCircle } from "lucide-react";
import { GlassCard } from "@/components/wellness/glass-card";
import { fetchWithAuth } from "@/lib/client-auth";
import { PageHeader } from "@/components/portal-nav-shell";

interface OrgLite {
  id: string;
  name: string;
}

interface NotificationRow {
  id: string;
  organizationId: string | null;
  organization: OrgLite | null;
  title: string;
  body: string;
  audienceType: string;
  audience: unknown;
  channels: string[];
  startTime: string;
  endTime: string | null;
  status: string;
  emergency: boolean;
  createdBy: { id: string; name: string | null; email: string } | null;
  createdAt: string;
}

const STATUS_FILTERS = ["all", "scheduled", "live", "ended", "cancelled"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

export function EventsNotificationsPage() {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [orgs, setOrgs] = useState<OrgLite[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const data = await fetchWithAuth<{ notifications: NotificationRow[] }>(
        `/api/web/admin/notifications?${params}`,
      );
      setItems(data.notifications);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load broadcasts.");
    }
  }

  async function loadOrgs() {
    try {
      const data = await fetchWithAuth<{ organizations: OrgLite[] }>(
        "/api/web/organizations?take=200",
      );
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

  async function updateStatus(id: string, action: "cancel" | "end") {
    if (!confirm(action === "cancel" ? "Cancel this broadcast?" : "End this broadcast now?")) return;
    setBusy(true);
    try {
      await fetchWithAuth(`/api/web/admin/notifications/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Live Events & Notifications"
        subtitle="Schedule, target, pause, or end broadcasts. Emergency channels are highlighted."
        actions={
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full bg-[#10242A] px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            New broadcast
          </button>
        }
      />

      {showCreate ? (
        <BroadcastForm
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
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
                statusFilter === f
                  ? "bg-[#10242A] text-white"
                  : "border border-[#D7E3E7] text-[#3A5661] hover:bg-[#F4F8F9]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </GlassCard>

      {error ? (
        <div className="mb-4 rounded-[16px] bg-[#FFF5F7] px-4 py-3 text-sm text-[#B42318]">{error}</div>
      ) : null}

      <div className="space-y-3">
        {items.length === 0 ? (
          <GlassCard className="p-10 text-center text-sm text-[#56707B]">No broadcasts.</GlassCard>
        ) : null}
        {items.map((n) => (
          <GlassCard key={n.id} className={n.emergency ? "border-l-4 border-l-[#B42318] p-5" : "p-5"}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {n.emergency ? (
                    <AlertTriangle className="h-4 w-4 text-[#B42318]" />
                  ) : (
                    <BellRing className="h-4 w-4 text-[#167C80]" />
                  )}
                  <h3 className="text-base font-semibold text-[#10242A]">{n.title}</h3>
                  <StatusBadge status={n.status} />
                  {n.emergency ? (
                    <span className="rounded-full bg-[#FFE6EA] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#B42318]">
                      Emergency
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-[#3A5661]">{n.body}</p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#56707B]">
                  <span>Audience: {n.audienceType}</span>
                  <span>Channels: {n.channels.join(", ")}</span>
                  <span>Org: {n.organization?.name ?? "All organizations"}</span>
                  <span>Start: {formatDate(n.startTime)}</span>
                  {n.endTime ? <span>End: {formatDate(n.endTime)}</span> : null}
                  {n.createdBy ? <span>By: {n.createdBy.email}</span> : null}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {n.status === "scheduled" ? (
                  <button
                    disabled={busy}
                    onClick={() => void updateStatus(n.id, "cancel")}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#D7E3E7] px-3 py-1.5 text-xs font-semibold text-[#56707B] disabled:opacity-50"
                  >
                    <PauseCircle className="h-3 w-3" />
                    Cancel
                  </button>
                ) : null}
                {n.status === "live" ? (
                  <button
                    disabled={busy}
                    onClick={() => void updateStatus(n.id, "end")}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#10242A] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    <StopCircle className="h-3 w-3" />
                    End now
                  </button>
                ) : null}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    scheduled: "bg-[#EAF4FF] text-[#0F6FFF]",
    live: "bg-[#E6F5EC] text-[#0A6D33]",
    ended: "bg-[#F0F0F0] text-[#56707B]",
    cancelled: "bg-[#FFE6EA] text-[#B42318]",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
        styles[status] ?? "bg-[#F0F0F0] text-[#56707B]"
      }`}
    >
      {status}
    </span>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

const CHANNELS = ["in_app", "email", "push", "sms"] as const;
const AUDIENCES = ["all", "organization", "role", "department", "cohort"] as const;

function BroadcastForm({
  orgs,
  onClose,
  onCreated,
}: {
  orgs: OrgLite[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    title: "",
    body: "",
    audienceType: "all" as (typeof AUDIENCES)[number],
    organizationId: "",
    channels: ["in_app"] as string[],
    startTime: defaultStart(),
    endTime: "",
    emergency: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requiresOrg = useMemo(
    () => form.audienceType === "organization" || form.audienceType === "department",
    [form.audienceType],
  );

  function toggleChannel(c: string) {
    setForm((f) => ({
      ...f,
      channels: f.channels.includes(c) ? f.channels.filter((x) => x !== c) : [...f.channels, c],
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      setError("Title and body are required.");
      return;
    }
    if (form.channels.length === 0) {
      setError("Pick at least one channel.");
      return;
    }
    if (requiresOrg && !form.organizationId) {
      setError("Organization required for this audience.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        body: form.body.trim(),
        audienceType: form.audienceType,
        channels: form.channels,
        startTime: new Date(form.startTime).toISOString(),
        emergency: form.emergency,
      };
      if (form.organizationId) payload.organizationId = form.organizationId;
      if (form.endTime) payload.endTime = new Date(form.endTime).toISOString();

      await fetchWithAuth("/api/web/admin/notifications", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create broadcast.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <GlassCard className="mb-4 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#10242A]">New broadcast</h2>
        <button onClick={onClose} className="text-[#56707B] hover:text-[#10242A]">
          <X className="h-4 w-4" />
        </button>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">Title *</span>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            maxLength={160}
            className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none focus:border-[#167C80]"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">Body *</span>
          <textarea
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            rows={4}
            maxLength={4000}
            className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none focus:border-[#167C80]"
          />
          <span className="text-[10px] text-[#56707B]">{form.body.length}/4000</span>
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">Audience</span>
            <select
              value={form.audienceType}
              onChange={(e) =>
                setForm((f) => ({ ...f, audienceType: e.target.value as (typeof AUDIENCES)[number] }))
              }
              className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none"
            >
              {AUDIENCES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">
              Organization {requiresOrg ? "*" : "(optional)"}
            </span>
            <select
              value={form.organizationId}
              onChange={(e) => setForm((f) => ({ ...f, organizationId: e.target.value }))}
              className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none"
            >
              <option value="">— None (platform-wide) —</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#56707B]">Channels *</span>
          <div className="flex flex-wrap gap-2">
            {CHANNELS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => toggleChannel(c)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  form.channels.includes(c)
                    ? "bg-[#167C80] text-white"
                    : "border border-[#D7E3E7] text-[#3A5661]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">Start *</span>
            <input
              type="datetime-local"
              value={form.startTime}
              onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
              className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">End (optional)</span>
            <input
              type="datetime-local"
              value={form.endTime}
              onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
              className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none"
            />
          </label>
        </div>

        <label className="flex items-center gap-2 rounded-[14px] border border-[#FFE6EA] bg-[#FFF5F7] px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={form.emergency}
            onChange={(e) => setForm((f) => ({ ...f, emergency: e.target.checked }))}
          />
          <AlertTriangle className="h-4 w-4 text-[#B42318]" />
          <span className="font-semibold text-[#B42318]">Emergency broadcast</span>
          <span className="text-xs text-[#56707B]">— bypasses quiet hours, audited as critical.</span>
        </label>

        {form.title || form.body ? (
          <div className="rounded-[14px] border border-[#D7E3E7] bg-[#F8FBFC] p-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#56707B]">Preview</p>
            <p className="text-sm font-semibold text-[#10242A]">{form.title || "(title)"}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-[#3A5661]">{form.body || "(body)"}</p>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-[14px] bg-[#FFF5F7] px-3 py-2 text-sm text-[#B42318]">{error}</div>
        ) : null}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full border border-[#D7E3E7] px-4 py-2 text-sm font-semibold">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-[#10242A] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Publishing…" : "Publish"}
          </button>
        </div>
      </form>
    </GlassCard>
  );
}

function defaultStart(): string {
  const d = new Date(Date.now() + 5 * 60 * 1000);
  d.setSeconds(0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
