"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Bell, Clock, Radio, XCircle } from "lucide-react";
import { GlassCard } from "@/components/wellness/glass-card";
import { fetchWithAuth } from "@/lib/client-auth";
import { PageHeader } from "@/components/portal-nav-shell";

interface Organization {
  id: string;
  name: string;
  referralCode: string;
}

interface Notification {
  id: string;
  organizationId: string | null;
  title: string;
  body: string;
  audienceType: string;
  audience: unknown;
  channels: unknown;
  startTime: string;
  endTime: string | null;
  status: string;
  emergency: boolean;
  createdAt: string;
  organization: { id: string; name: string } | null;
  createdBy: { id: string; name: string | null; email: string } | null;
}

const STATUS_FILTERS = ["all", "scheduled", "live", "ended", "cancelled"];

const DEFAULT_FORM = {
  organizationId: "",
  title: "",
  body: "",
  audienceType: "all" as "all" | "organization" | "role" | "department" | "cohort",
  channels: ["in_app"] as string[],
  startTime: "",
  endTime: "",
  emergency: false,
};

function toLocalInput(date: Date) {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

export function LiveEventsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [form, setForm] = useState(() => ({
    ...DEFAULT_FORM,
    startTime: toLocalInput(new Date()),
  }));
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setError(null);
      const [listRes, orgsRes] = await Promise.all([
        fetchWithAuth<{ notifications: Notification[] }>("/api/web/admin/notifications"),
        fetchWithAuth<{ organizations: Organization[] }>("/api/web/organizations"),
      ]);
      setItems(listRes.notifications);
      setOrganizations(orgsRes.organizations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load notifications.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return items;
    return items.filter((n) => n.status === statusFilter);
  }, [items, statusFilter]);

  function toggleChannel(ch: string) {
    setForm((f) => ({
      ...f,
      channels: f.channels.includes(ch) ? f.channels.filter((c) => c !== ch) : [...f.channels, ch],
    }));
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!form.title.trim() || !form.body.trim() || !form.startTime) return;
    setSaving(true);
    setError(null);
    try {
      await fetchWithAuth("/api/web/admin/notifications", {
        method: "POST",
        body: JSON.stringify({
          organizationId: form.organizationId || null,
          title: form.title.trim(),
          body: form.body.trim(),
          audienceType: form.audienceType,
          channels: form.channels,
          startTime: new Date(form.startTime).toISOString(),
          endTime: form.endTime ? new Date(form.endTime).toISOString() : undefined,
          emergency: form.emergency,
        }),
      });
      setForm({ ...DEFAULT_FORM, startTime: toLocalInput(new Date()) });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create notification.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAction(id: string, action: "cancel" | "end") {
    try {
      await fetchWithAuth(`/api/web/admin/notifications/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update.");
    }
  }

  return (
    <>
      <PageHeader
        title="Live Events & Notifications"
        subtitle="Schedule broadcasts, run live events, or trigger emergency alerts."
      />

      <GlassCard className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-white/90">
          <Radio className="h-4 w-4" />
          <span className="text-sm font-semibold">Create broadcast</span>
        </div>
        <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs text-white/60">Title</span>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm text-white"
              required
            />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs text-white/60">Body</span>
            <textarea
              rows={3}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm text-white"
              required
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-white/60">Organization</span>
            <select
              value={form.organizationId}
              onChange={(e) => setForm({ ...form, organizationId: e.target.value })}
              className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm text-white"
            >
              <option value="" className="bg-[#10242A]">
                All organizations
              </option>
              {organizations.map((o) => (
                <option key={o.id} value={o.id} className="bg-[#10242A]">
                  {o.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs text-white/60">Audience</span>
            <select
              value={form.audienceType}
              onChange={(e) => setForm({ ...form, audienceType: e.target.value as typeof form.audienceType })}
              className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm text-white"
            >
              <option value="all" className="bg-[#10242A]">Everyone in scope</option>
              <option value="organization" className="bg-[#10242A]">Organization members</option>
              <option value="role" className="bg-[#10242A]">By role</option>
              <option value="department" className="bg-[#10242A]">By department</option>
              <option value="cohort" className="bg-[#10242A]">Custom cohort</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs text-white/60">Start</span>
            <input
              type="datetime-local"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm text-white"
              required
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-white/60">End (optional)</span>
            <input
              type="datetime-local"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm text-white"
            />
          </label>
          <div className="md:col-span-2 flex flex-wrap items-center gap-4">
            <span className="text-xs text-white/60">Channels:</span>
            {["in_app", "email", "push", "sms"].map((ch) => (
              <label key={ch} className="flex items-center gap-2 text-xs text-white/80">
                <input
                  type="checkbox"
                  checked={form.channels.includes(ch)}
                  onChange={() => toggleChannel(ch)}
                />
                {ch}
              </label>
            ))}
            <label className="ml-auto flex items-center gap-2 text-xs text-red-200">
              <input
                type="checkbox"
                checked={form.emergency}
                onChange={(e) => setForm({ ...form, emergency: e.target.checked })}
              />
              <AlertTriangle className="h-3.5 w-3.5" /> Emergency broadcast
            </label>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className={`rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
                form.emergency
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-[#167C80] hover:bg-[#1a9397]"
              }`}
            >
              {saving ? "Sending…" : form.emergency ? "Send emergency broadcast" : "Schedule broadcast"}
            </button>
          </div>
        </form>
      </GlassCard>

      <GlassCard className="p-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              statusFilter === s
                ? "bg-[#167C80] text-white"
                : "bg-white/10 text-white/70 hover:bg-white/15"
            }`}
          >
            {s}
          </button>
        ))}
      </GlassCard>

      {error ? (
        <GlassCard className="p-4 border border-red-400/40 text-sm text-red-200">
          {error}
        </GlassCard>
      ) : null}

      {filtered.length === 0 ? (
        <GlassCard className="p-6 text-sm text-white/60">No notifications match.</GlassCard>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => (
            <GlassCard key={n.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {n.emergency ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 text-red-200 px-2 py-0.5 text-[11px] font-semibold">
                        <AlertTriangle className="h-3 w-3" /> Emergency
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/10 text-white/70 px-2 py-0.5 text-[11px]">
                        <Bell className="h-3 w-3" /> Broadcast
                      </span>
                    )}
                    <span className="rounded-full bg-white/10 text-white/80 px-2 py-0.5 text-[11px] capitalize">
                      {n.status}
                    </span>
                    <span className="text-[11px] text-white/50">{n.audienceType}</span>
                    {n.organization ? (
                      <span className="text-[11px] text-white/50">• {n.organization.name}</span>
                    ) : (
                      <span className="text-[11px] text-white/50">• All orgs</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-semibold text-white">{n.title}</p>
                  <p className="text-xs text-white/70 whitespace-pre-wrap">{n.body}</p>
                  <p className="mt-1 text-[11px] text-white/50 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(n.startTime).toLocaleString()}
                    {n.endTime ? ` → ${new Date(n.endTime).toLocaleString()}` : ""}
                  </p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {n.status === "scheduled" ? (
                    <button
                      type="button"
                      onClick={() => handleAction(n.id, "cancel")}
                      className="rounded-full bg-white/10 hover:bg-white/20 px-3 py-1 text-xs text-white/80 inline-flex items-center gap-1"
                    >
                      <XCircle className="h-3 w-3" /> Cancel
                    </button>
                  ) : null}
                  {n.status === "live" ? (
                    <button
                      type="button"
                      onClick={() => handleAction(n.id, "end")}
                      className="rounded-full bg-white/10 hover:bg-white/20 px-3 py-1 text-xs text-white/80"
                    >
                      End now
                    </button>
                  ) : null}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </>
  );
}
