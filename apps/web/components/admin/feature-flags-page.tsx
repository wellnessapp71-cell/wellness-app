"use client";

import { useEffect, useMemo, useState } from "react";
import { Flag, Plus } from "lucide-react";
import { GlassCard } from "@/components/wellness/glass-card";
import { fetchWithAuth } from "@/lib/client-auth";
import { PageHeader } from "@/components/portal-nav-shell";

interface FeatureFlag {
  id: string;
  flagKey: string;
  organizationId: string | null;
  module: string;
  enabled: boolean;
  notes: string | null;
  rolloutScope: unknown;
  createdAt: string;
  updatedAt: string;
  organization: { id: string; name: string } | null;
}

interface ListResponse {
  flags: FeatureFlag[];
}

interface Organization {
  id: string;
  name: string;
  referralCode: string;
}

interface OrgsResponse {
  organizations: Organization[];
}

const DEFAULT_FORM = {
  flagKey: "",
  module: "",
  organizationId: "",
  enabled: false,
  notes: "",
};

const MODULE_OPTIONS = [
  "core",
  "physical",
  "mental",
  "social",
  "lifestyle",
  "professional",
  "hr",
  "admin",
  "notifications",
  "experimental",
];

export function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [scopeFilter, setScopeFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (scopeFilter !== "all") params.set("organizationId", scopeFilter);
      if (moduleFilter !== "all") params.set("module", moduleFilter);
      const suffix = params.toString() ? `?${params.toString()}` : "";
      const [flagsRes, orgsRes] = await Promise.all([
        fetchWithAuth<ListResponse>(`/api/web/admin/feature-flags${suffix}`),
        fetchWithAuth<OrgsResponse>("/api/web/organizations"),
      ]);
      setFlags(flagsRes.flags);
      setOrganizations(orgsRes.organizations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load feature flags.");
    }
  }

  useEffect(() => {
    void load();
  }, [scopeFilter, moduleFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, FeatureFlag[]>();
    for (const f of flags) {
      const list = map.get(f.module) ?? [];
      list.push(f);
      map.set(f.module, list);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [flags]);

  async function toggle(flag: FeatureFlag) {
    try {
      await fetchWithAuth("/api/web/admin/feature-flags", {
        method: "POST",
        body: JSON.stringify({
          flagKey: flag.flagKey,
          organizationId: flag.organizationId,
          module: flag.module,
          enabled: !flag.enabled,
          notes: flag.notes ?? "",
        }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to toggle flag.");
    }
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!form.flagKey.trim() || !form.module.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await fetchWithAuth("/api/web/admin/feature-flags", {
        method: "POST",
        body: JSON.stringify({
          flagKey: form.flagKey.trim(),
          module: form.module,
          organizationId: form.organizationId || null,
          enabled: form.enabled,
          notes: form.notes.trim(),
        }),
      });
      setForm(DEFAULT_FORM);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save flag.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Feature Flags"
        subtitle="Toggle experimental or gated features globally or per organization."
      />

      <GlassCard className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-white/90">
          <Plus className="h-4 w-4" />
          <span className="text-sm font-semibold">Create or update flag</span>
        </div>
        <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs text-white/60">Flag key</span>
            <input
              type="text"
              value={form.flagKey}
              onChange={(e) => setForm({ ...form, flagKey: e.target.value })}
              placeholder="e.g. mental.ai_therapist"
              className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-white/60">Module</span>
            <select
              value={form.module}
              onChange={(e) => setForm({ ...form, module: e.target.value })}
              className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm text-white"
            >
              <option value="" className="bg-[#10242A]">
                Select module…
              </option>
              {MODULE_OPTIONS.map((m) => (
                <option key={m} value={m} className="bg-[#10242A]">
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs text-white/60">Scope</span>
            <select
              value={form.organizationId}
              onChange={(e) => setForm({ ...form, organizationId: e.target.value })}
              className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm text-white"
            >
              <option value="" className="bg-[#10242A]">
                Global (all orgs)
              </option>
              {organizations.map((o) => (
                <option key={o.id} value={o.id} className="bg-[#10242A]">
                  {o.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-white/80 mt-6">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              className="h-4 w-4"
            />
            Enabled on save
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs text-white/60">Notes</span>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Context for rollout / owner"
              className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm text-white"
            />
          </label>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-[#167C80] hover:bg-[#1a9397] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save flag"}
            </button>
          </div>
        </form>
      </GlassCard>

      <GlassCard className="p-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 text-xs text-white/70">
          Scope:
          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value)}
            className="rounded-lg bg-white/10 border border-white/15 px-2 py-1 text-white"
          >
            <option value="all" className="bg-[#10242A]">
              All
            </option>
            <option value="global" className="bg-[#10242A]">
              Global only
            </option>
            {organizations.map((o) => (
              <option key={o.id} value={o.id} className="bg-[#10242A]">
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/70">
          Module:
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="rounded-lg bg-white/10 border border-white/15 px-2 py-1 text-white"
          >
            <option value="all" className="bg-[#10242A]">
              All
            </option>
            {MODULE_OPTIONS.map((m) => (
              <option key={m} value={m} className="bg-[#10242A]">
                {m}
              </option>
            ))}
          </select>
        </div>
      </GlassCard>

      {error ? (
        <GlassCard className="p-4 border border-red-400/40 text-sm text-red-200">
          {error}
        </GlassCard>
      ) : null}

      {grouped.length === 0 ? (
        <GlassCard className="p-6 text-sm text-white/60">No flags match the current filters.</GlassCard>
      ) : (
        grouped.map(([module_, items]) => (
          <GlassCard key={module_} className="p-6 space-y-3">
            <div className="flex items-center gap-2 text-white/90">
              <Flag className="h-4 w-4" />
              <span className="text-sm font-semibold capitalize">{module_}</span>
              <span className="text-xs text-white/50">{items.length}</span>
            </div>
            <ul className="space-y-2">
              {items.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between gap-4 rounded-xl bg-white/5 border border-white/10 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-white/90 truncate">{f.flagKey}</p>
                    <p className="text-xs text-white/50">
                      {f.organization ? f.organization.name : "Global"}
                      {f.notes ? ` • ${f.notes}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(f)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      f.enabled
                        ? "bg-emerald-400/20 text-emerald-200 hover:bg-emerald-400/30"
                        : "bg-white/10 text-white/70 hover:bg-white/15"
                    }`}
                  >
                    {f.enabled ? "Enabled" : "Disabled"}
                  </button>
                </li>
              ))}
            </ul>
          </GlassCard>
        ))
      )}
    </>
  );
}
