"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Palette, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/wellness/glass-card";
import { fetchWithAuth } from "@/lib/client-auth";
import { PageHeader } from "@/components/portal-nav-shell";

interface Organization {
  id: string;
  name: string;
  referralCode: string;
}

interface Branding {
  id: string;
  organizationId: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  timezone: string;
  domains: unknown;
  emailTemplate: unknown;
  communicationPrefs: unknown;
}

interface Department {
  id: string;
  name: string;
  organizationId: string;
  parentId: string | null;
}

interface OrgsResponse {
  organizations: Organization[];
}

interface BrandingResponse {
  branding: Branding | null;
  departments: Department[];
}

const DEFAULT_FORM = {
  logoUrl: "",
  primaryColor: "#167C80",
  secondaryColor: "#10242A",
  timezone: "UTC",
  domains: "",
};

export function BrandingPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [form, setForm] = useState(DEFAULT_FORM);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [newDept, setNewDept] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const data = await fetchWithAuth<OrgsResponse>("/api/web/organizations");
        setOrganizations(data.organizations);
        if (data.organizations[0]) setSelectedOrg(data.organizations[0].id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load organizations.");
      }
    })();
  }, []);

  async function loadBranding(orgId: string) {
    try {
      setError(null);
      const data = await fetchWithAuth<BrandingResponse>(
        `/api/web/admin/organizations/${orgId}/branding`,
      );
      const b = data.branding;
      setForm({
        logoUrl: b?.logoUrl ?? "",
        primaryColor: b?.primaryColor ?? "#167C80",
        secondaryColor: b?.secondaryColor ?? "#10242A",
        timezone: b?.timezone ?? "UTC",
        domains: Array.isArray(b?.domains) ? (b?.domains as string[]).join(", ") : "",
      });
      setDepartments(data.departments);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load branding.");
    }
  }

  useEffect(() => {
    if (selectedOrg) void loadBranding(selectedOrg);
  }, [selectedOrg]);

  const selectedOrgMeta = useMemo(
    () => organizations.find((o) => o.id === selectedOrg) ?? null,
    [organizations, selectedOrg],
  );

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedOrg) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const domains = form.domains
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await fetchWithAuth(`/api/web/admin/organizations/${selectedOrg}/branding`, {
        method: "PUT",
        body: JSON.stringify({
          logoUrl: form.logoUrl.trim() || null,
          primaryColor: form.primaryColor.trim() || null,
          secondaryColor: form.secondaryColor.trim() || null,
          timezone: form.timezone.trim() || "UTC",
          domains,
        }),
      });
      setMessage("Branding saved.");
      await loadBranding(selectedOrg);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save branding.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddDepartment(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedOrg || !newDept.trim()) return;
    try {
      await fetchWithAuth(`/api/web/admin/organizations/${selectedOrg}/departments`, {
        method: "POST",
        body: JSON.stringify({ name: newDept.trim() }),
      });
      setNewDept("");
      await loadBranding(selectedOrg);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add department.");
    }
  }

  async function handleDeleteDepartment(deptId: string) {
    if (!selectedOrg) return;
    if (!confirm("Delete this department?")) return;
    try {
      await fetchWithAuth(
        `/api/web/admin/organizations/${selectedOrg}/departments/${deptId}`,
        { method: "DELETE" },
      );
      await loadBranding(selectedOrg);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete department.");
    }
  }

  return (
    <>
      <PageHeader
        title="Organization Settings & Branding"
        subtitle="Per-organization logo, colors, email templates, timezone, department structure."
      />

      <GlassCard className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-white/90">
          <Building2 className="h-4 w-4" />
          <span className="text-sm font-semibold">Select organization</span>
        </div>
        <select
          value={selectedOrg}
          onChange={(e) => setSelectedOrg(e.target.value)}
          className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm text-white"
        >
          {organizations.map((o) => (
            <option key={o.id} value={o.id} className="bg-[#10242A]">
              {o.name} ({o.referralCode})
            </option>
          ))}
        </select>
        {selectedOrgMeta ? (
          <p className="text-xs text-white/60">Org ID: {selectedOrgMeta.id}</p>
        ) : null}
      </GlassCard>

      {error ? (
        <GlassCard className="p-4 border border-red-400/40 text-sm text-red-200">
          {error}
        </GlassCard>
      ) : null}
      {message ? (
        <GlassCard className="p-4 border border-emerald-400/40 text-sm text-emerald-200">
          {message}
        </GlassCard>
      ) : null}

      <GlassCard className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-white/90">
          <Palette className="h-4 w-4" />
          <span className="text-sm font-semibold">Branding</span>
        </div>
        <form onSubmit={handleSave} className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs text-white/60">Logo URL</span>
            <input
              type="url"
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              placeholder="https://..."
              className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-white/60">Primary color</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.primaryColor}
                onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                className="h-10 w-12 rounded-lg bg-transparent border border-white/15"
              />
              <input
                type="text"
                value={form.primaryColor}
                onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                className="flex-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm text-white"
              />
            </div>
          </label>
          <label className="space-y-1">
            <span className="text-xs text-white/60">Secondary color</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.secondaryColor}
                onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })}
                className="h-10 w-12 rounded-lg bg-transparent border border-white/15"
              />
              <input
                type="text"
                value={form.secondaryColor}
                onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })}
                className="flex-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm text-white"
              />
            </div>
          </label>
          <label className="space-y-1">
            <span className="text-xs text-white/60">Timezone</span>
            <input
              type="text"
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              placeholder="UTC"
              className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-white/60">Email domains (comma-separated)</span>
            <input
              type="text"
              value={form.domains}
              onChange={(e) => setForm({ ...form, domains: e.target.value })}
              placeholder="acme.com, acme.co"
              className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm text-white"
            />
          </label>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={saving || !selectedOrg}
              className="rounded-full bg-[#167C80] hover:bg-[#1a9397] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save branding"}
            </button>
          </div>
        </form>
      </GlassCard>

      <GlassCard className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white/90">Departments</span>
          <span className="text-xs text-white/60">{departments.length} total</span>
        </div>
        <form onSubmit={handleAddDepartment} className="flex gap-2">
          <input
            type="text"
            value={newDept}
            onChange={(e) => setNewDept(e.target.value)}
            placeholder="New department name"
            className="flex-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm text-white"
          />
          <button
            type="submit"
            disabled={!newDept.trim() || !selectedOrg}
            className="rounded-full bg-white/15 hover:bg-white/25 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Add
          </button>
        </form>
        {departments.length === 0 ? (
          <p className="text-xs text-white/60">No departments yet.</p>
        ) : (
          <ul className="space-y-2">
            {departments.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-3 py-2"
              >
                <span className="text-sm text-white/90">{d.name}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteDepartment(d.id)}
                  className="text-white/60 hover:text-red-300"
                  aria-label="Delete department"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </>
  );
}
