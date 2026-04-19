"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Building2, Plus, Search, Power, PowerOff, Save, X } from "lucide-react";
import { GlassCard } from "@/components/wellness/glass-card";
import { fetchWithAuth } from "@/lib/client-auth";
import { PageHeader } from "@/components/portal-nav-shell";

interface OrgRow {
  id: string;
  name: string;
  slug: string;
  referralCode: string;
  industry: string | null;
  companySize: number | null;
  website: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  active: boolean;
  createdAt: string;
  _count: {
    memberships: number;
    hrProfiles: number;
    departments: number;
    hrReferralCodes: number;
  };
}

interface ListResponse {
  organizations: OrgRow[];
  total: number;
  take: number;
  skip: number;
}

const PAGE_SIZE = 25;

export function OrganizationsRegistryPage() {
  const [list, setList] = useState<ListResponse | null>(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "true" | "false">("all");
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (activeFilter !== "all") params.set("active", activeFilter);
    params.set("take", String(PAGE_SIZE));
    params.set("skip", String(page * PAGE_SIZE));
    return params.toString();
  }, [search, activeFilter, page]);

  async function load() {
    try {
      setError(null);
      const data = await fetchWithAuth<ListResponse>(`/api/web/organizations?${query}`);
      setList(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load organizations.");
    }
  }

  useEffect(() => {
    void load();
  }, [query]);

  async function toggleActive(org: OrgRow) {
    if (!confirm(`${org.active ? "Deactivate" : "Reactivate"} ${org.name}?`)) return;
    setBusy(true);
    try {
      await fetchWithAuth(`/api/web/organizations/${org.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !org.active }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setBusy(false);
    }
  }

  const totalPages = list ? Math.max(1, Math.ceil(list.total / PAGE_SIZE)) : 1;

  return (
    <>
      <PageHeader
        title="Organizations"
        subtitle="Registry of member companies — referral onboarding, HR coverage, employee count, and lifecycle."
        actions={
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full bg-[#10242A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#17303A]"
          >
            <Plus className="h-4 w-4" />
            New organization
          </button>
        }
      />

      {showCreate ? (
        <CreateOrgForm
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            void load();
          }}
        />
      ) : null}

      <GlassCard className="mb-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[260px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#56707B]" />
            <input
              value={search}
              onChange={(e) => {
                setPage(0);
                setSearch(e.target.value);
              }}
              placeholder="Search by name, referral code, industry…"
              className="w-full rounded-[14px] border border-[#D7E3E7] bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#167C80]"
            />
          </div>
          <select
            value={activeFilter}
            onChange={(e) => {
              setPage(0);
              setActiveFilter(e.target.value as typeof activeFilter);
            }}
            className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none"
          >
            <option value="all">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <div className="ml-auto text-xs text-[#56707B]">
            {list ? `${list.total} total` : "Loading…"}
          </div>
        </div>
      </GlassCard>

      {error ? (
        <div className="mb-4 rounded-[16px] bg-[#FFF5F7] px-4 py-3 text-sm text-[#B42318]">{error}</div>
      ) : null}

      <div className="space-y-3">
        {list?.organizations.length === 0 ? (
          <GlassCard className="p-10 text-center text-sm text-[#56707B]">
            No organizations match these filters.
          </GlassCard>
        ) : null}
        {list?.organizations.map((org) =>
          editingId === org.id ? (
            <EditOrgRow
              key={org.id}
              org={org}
              onCancel={() => setEditingId(null)}
              onSaved={() => {
                setEditingId(null);
                void load();
              }}
            />
          ) : (
            <GlassCard key={org.id} className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#167C80]" />
                    <h3 className="text-lg font-semibold text-[#10242A]">{org.name}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        org.active
                          ? "bg-[#E6F5EC] text-[#0A6D33]"
                          : "bg-[#F0F0F0] text-[#56707B]"
                      }`}
                    >
                      {org.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#56707B]">
                    {org.industry ?? "General"} • Referral{" "}
                    <span className="font-mono text-[#10242A]">{org.referralCode}</span>
                    {org.companySize ? ` • ${org.companySize.toLocaleString()} seats` : ""}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#3A5661]">
                    <span>{org._count.memberships} employees</span>
                    <span>{org._count.hrProfiles} HR users</span>
                    <span>{org._count.departments} departments</span>
                    <span>{org._count.hrReferralCodes} referral codes</span>
                  </div>
                  {org.contactEmail || org.website ? (
                    <p className="mt-2 text-xs text-[#56707B]">
                      {org.contactEmail ? <span>{org.contactEmail}</span> : null}
                      {org.contactEmail && org.website ? " • " : ""}
                      {org.website ? (
                        <a
                          href={org.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#167C80] hover:underline"
                        >
                          {org.website}
                        </a>
                      ) : null}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/branding?org=${org.id}`}
                    className="rounded-full border border-[#D7E3E7] px-3 py-1.5 text-xs font-semibold text-[#17303A] hover:bg-[#F4F8F9]"
                  >
                    Branding
                  </Link>
                  <Link
                    href={`/admin/feature-flags?org=${org.id}`}
                    className="rounded-full border border-[#D7E3E7] px-3 py-1.5 text-xs font-semibold text-[#17303A] hover:bg-[#F4F8F9]"
                  >
                    Feature flags
                  </Link>
                  <button
                    onClick={() => setEditingId(org.id)}
                    className="rounded-full bg-[#EEF6F7] px-3 py-1.5 text-xs font-semibold text-[#167C80] hover:bg-[#DCEDEF]"
                  >
                    Edit
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => void toggleActive(org)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                      org.active
                        ? "border border-[#F1D2D9] text-[#B42318] hover:bg-[#FFF5F7]"
                        : "border border-[#CDE9D8] text-[#0A6D33] hover:bg-[#EFF8F2]"
                    }`}
                  >
                    {org.active ? <PowerOff className="h-3 w-3" /> : <Power className="h-3 w-3" />}
                    {org.active ? "Deactivate" : "Reactivate"}
                  </button>
                </div>
              </div>
            </GlassCard>
          ),
        )}
      </div>

      {list && list.total > PAGE_SIZE ? (
        <div className="mt-4 flex items-center justify-between text-sm text-[#56707B]">
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-full border border-[#D7E3E7] px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
            >
              Prev
            </button>
            <button
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-full border border-[#D7E3E7] px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function CreateOrgForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: "",
    industry: "",
    companySize: "",
    website: "",
    contactEmail: "",
    contactPhone: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { name: form.name.trim() };
      if (form.industry.trim()) payload.industry = form.industry.trim();
      if (form.companySize.trim()) payload.companySize = Number(form.companySize.trim());
      if (form.website.trim()) payload.website = form.website.trim();
      if (form.contactEmail.trim()) payload.contactEmail = form.contactEmail.trim();
      if (form.contactPhone.trim()) payload.contactPhone = form.contactPhone.trim();
      await fetchWithAuth("/api/web/organizations", { method: "POST", body: JSON.stringify(payload) });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create organization.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <GlassCard className="mb-4 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#10242A]">New organization</h2>
        <button onClick={onClose} className="text-[#56707B] hover:text-[#10242A]">
          <X className="h-4 w-4" />
        </button>
      </div>
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        {(
          [
            ["name", "Company name *", "text"],
            ["industry", "Industry", "text"],
            ["companySize", "Company size", "number"],
            ["website", "Website", "url"],
            ["contactEmail", "Contact email", "email"],
            ["contactPhone", "Contact phone", "tel"],
          ] as const
        ).map(([key, label, type]) => (
          <label key={key} className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#56707B]">{label}</span>
            <input
              type={type}
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className="rounded-[14px] border border-[#D7E3E7] bg-white px-3 py-2 text-sm outline-none focus:border-[#167C80]"
            />
          </label>
        ))}
        {error ? <div className="md:col-span-2 rounded-[14px] bg-[#FFF5F7] px-3 py-2 text-sm text-[#B42318]">{error}</div> : null}
        <div className="md:col-span-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full border border-[#D7E3E7] px-4 py-2 text-sm font-semibold text-[#17303A]">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-full bg-[#10242A] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Create organization"}
          </button>
        </div>
      </form>
    </GlassCard>
  );
}

function EditOrgRow({ org, onCancel, onSaved }: { org: OrgRow; onCancel: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: org.name,
    industry: org.industry ?? "",
    companySize: org.companySize?.toString() ?? "",
    website: org.website ?? "",
    contactEmail: org.contactEmail ?? "",
    contactPhone: org.contactPhone ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        industry: form.industry.trim() || null,
        companySize: form.companySize.trim() ? Number(form.companySize.trim()) : null,
        website: form.website.trim() || null,
        contactEmail: form.contactEmail.trim() || null,
        contactPhone: form.contactPhone.trim() || null,
      };
      await fetchWithAuth(`/api/web/organizations/${org.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <GlassCard className="border border-[#167C80]/40 p-5">
      <div className="grid gap-3 md:grid-cols-2">
        {(
          [
            ["name", "Name"],
            ["industry", "Industry"],
            ["companySize", "Company size"],
            ["website", "Website"],
            ["contactEmail", "Contact email"],
            ["contactPhone", "Contact phone"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#56707B]">{label}</span>
            <input
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className="rounded-[12px] border border-[#D7E3E7] bg-white px-3 py-1.5 text-sm outline-none focus:border-[#167C80]"
            />
          </label>
        ))}
      </div>
      {error ? <div className="mt-3 rounded-[12px] bg-[#FFF5F7] px-3 py-2 text-xs text-[#B42318]">{error}</div> : null}
      <div className="mt-3 flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-full border border-[#D7E3E7] px-3 py-1.5 text-xs font-semibold">
          Cancel
        </button>
        <button
          disabled={saving}
          onClick={() => void save()}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#167C80] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          <Save className="h-3 w-3" />
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </GlassCard>
  );
}
