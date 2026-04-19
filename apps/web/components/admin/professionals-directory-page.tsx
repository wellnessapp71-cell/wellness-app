"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, CircleSlash, Stethoscope } from "lucide-react";
import { GlassCard } from "@/components/wellness/glass-card";
import { fetchWithAuth } from "@/lib/client-auth";
import { PageHeader } from "@/components/portal-nav-shell";

interface Professional {
  id: string;
  name: string;
  role: string;
  specialties: string[];
  licenseId: string | null;
  licenseExpiry: string | null;
  languages: string[];
  region: string | null;
  verificationStatus: string;
  bookable: boolean;
  status: string;
  bio: string | null;
  createdAt: string;
  user: { id: string; email: string; name: string | null } | null;
}

interface ListResponse {
  professionals: Professional[];
}

const DEFAULT_FORM = {
  name: "",
  role: "psychologist",
  specialties: "",
  languages: "",
  region: "",
  licenseId: "",
  licenseExpiry: "",
  bio: "",
};

export function ProfessionalsDirectoryPage() {
  const [list, setList] = useState<Professional[]>([]);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");

  async function load() {
    try {
      setError(null);
      const data = await fetchWithAuth<ListResponse>("/api/web/admin/professionals");
      setList(data.professionals);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load professionals.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    return list.filter((p) => {
      if (roleFilter !== "all" && p.role !== roleFilter) return false;
      if (verificationFilter !== "all" && p.verificationStatus !== verificationFilter) return false;
      return true;
    });
  }, [list, roleFilter, verificationFilter]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    try {
      setError(null);
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        role: form.role,
        specialties: form.specialties.split(",").map((s) => s.trim()).filter(Boolean),
        languages: form.languages.split(",").map((s) => s.trim()).filter(Boolean),
      };
      if (form.region.trim()) body.region = form.region.trim();
      if (form.licenseId.trim()) body.licenseId = form.licenseId.trim();
      if (form.licenseExpiry) body.licenseExpiry = new Date(form.licenseExpiry).toISOString();
      if (form.bio.trim()) body.bio = form.bio.trim();
      await fetchWithAuth("/api/web/admin/professionals", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setForm(DEFAULT_FORM);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add professional.");
    }
  }

  async function updatePro(id: string, body: Record<string, unknown>) {
    try {
      await fetchWithAuth(`/api/web/admin/professionals/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    }
  }

  return (
    <>
      <PageHeader
        title="Professionals Directory"
        subtitle="Psychologists, coaches, and experts — licensing, availability, and bookable state."
      />
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <GlassCard className="p-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-full border border-[#D7E3E7] bg-white px-3 py-1.5 text-xs font-semibold text-[#17303A] outline-none"
            >
              <option value="all">All roles</option>
              <option value="psychologist">Psychologists</option>
              <option value="coach">Coaches</option>
              <option value="nutritionist">Nutritionists</option>
              <option value="physio">Physios</option>
              <option value="expert">Experts</option>
            </select>
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="rounded-full border border-[#D7E3E7] bg-white px-3 py-1.5 text-xs font-semibold text-[#17303A] outline-none"
            >
              <option value="all">All verification</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          {error ? (
            <div className="mb-4 rounded-[16px] bg-[#FFF5F7] px-4 py-3 text-sm text-[#B42318]">{error}</div>
          ) : null}
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <p className="rounded-[18px] bg-[#F6F9FA] p-6 text-center text-sm text-[#56707B]">
                No professionals.
              </p>
            ) : null}
            {filtered.map((p) => (
              <div key={p.id} className="rounded-[22px] border border-[#E6EEF1] bg-[#FBFDFE] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-[#167C80]" />
                      <span className="text-sm font-semibold text-[#10242A]">{p.name}</span>
                      <span className="rounded-full bg-[#EEF6F7] px-2 py-0.5 text-[10px] font-semibold uppercase text-[#167C80]">
                        {p.role}
                      </span>
                      <VerificationBadge status={p.verificationStatus} />
                      {p.bookable ? (
                        <span className="rounded-full bg-[#E6F4EF] px-2 py-0.5 text-[10px] font-semibold uppercase text-[#0A6A4A]">
                          Bookable
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#EEF2F4] px-2 py-0.5 text-[10px] font-semibold uppercase text-[#56707B]">
                          Not bookable
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-[#56707B]">
                      {p.specialties.length > 0 ? p.specialties.join(", ") : "—"}
                      {p.region ? ` • ${p.region}` : ""}
                      {p.languages.length > 0 ? ` • ${p.languages.join(", ")}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-[#56707B]">
                      License: {p.licenseId ?? "—"}
                      {p.licenseExpiry ? ` • expires ${formatDate(p.licenseExpiry)}` : ""}
                    </p>
                    {p.bio ? <p className="mt-2 text-sm text-[#3A5661]">{p.bio}</p> : null}
                  </div>
                  <div className="flex shrink-0 flex-col gap-1.5">
                    <select
                      value={p.verificationStatus}
                      onChange={(e) => void updatePro(p.id, { verificationStatus: e.target.value })}
                      className="rounded-full border border-[#D7E3E7] bg-white px-3 py-1.5 text-xs font-semibold text-[#17303A] outline-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="verified">Verified</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <select
                      value={p.status}
                      onChange={(e) => void updatePro(p.id, { status: e.target.value })}
                      className="rounded-full border border-[#D7E3E7] bg-white px-3 py-1.5 text-xs font-semibold text-[#17303A] outline-none"
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="removed">Removed</option>
                    </select>
                    <button
                      onClick={() => void updatePro(p.id, { bookable: !p.bookable })}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#D7E3E7] px-3 py-1.5 text-xs font-semibold text-[#17303A] transition hover:bg-white"
                    >
                      {p.bookable ? <CircleSlash className="h-3.5 w-3.5" /> : <BadgeCheck className="h-3.5 w-3.5" />}
                      {p.bookable ? "Disable booking" : "Enable booking"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold tracking-tight text-[#10242A]">Add professional</h2>
          <form className="mt-4 space-y-3" onSubmit={handleCreate}>
            <Field label="Name" required>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                className={fieldClass}
              />
            </Field>
            <Field label="Role" required>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className={fieldClass}
              >
                <option value="psychologist">Psychologist</option>
                <option value="coach">Coach</option>
                <option value="nutritionist">Nutritionist</option>
                <option value="physio">Physio</option>
                <option value="expert">Expert</option>
              </select>
            </Field>
            <Field label="Specialties (comma-separated)">
              <input
                value={form.specialties}
                onChange={(e) => setForm((f) => ({ ...f, specialties: e.target.value }))}
                placeholder="CBT, Stress, Sleep"
                className={fieldClass}
              />
            </Field>
            <Field label="Languages (comma-separated)">
              <input
                value={form.languages}
                onChange={(e) => setForm((f) => ({ ...f, languages: e.target.value }))}
                placeholder="English, Hindi"
                className={fieldClass}
              />
            </Field>
            <Field label="Region">
              <input
                value={form.region}
                onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
                className={fieldClass}
              />
            </Field>
            <Field label="License ID">
              <input
                value={form.licenseId}
                onChange={(e) => setForm((f) => ({ ...f, licenseId: e.target.value }))}
                className={fieldClass}
              />
            </Field>
            <Field label="License expiry">
              <input
                type="datetime-local"
                value={form.licenseExpiry}
                onChange={(e) => setForm((f) => ({ ...f, licenseExpiry: e.target.value }))}
                className={fieldClass}
              />
            </Field>
            <Field label="Bio">
              <textarea
                rows={3}
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                className={fieldClass}
              />
            </Field>
            <button className="w-full rounded-[18px] bg-[#10242A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#17303A]">
              Add professional
            </button>
          </form>
        </GlassCard>
      </div>
    </>
  );
}

const fieldClass =
  "w-full rounded-[16px] border border-[#D7E3E7] bg-[#F8FBFC] px-3.5 py-2.5 text-sm text-[#17303A] outline-none transition focus:border-[#167C80] focus:bg-white";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-[#2F4952]">
        {label}
        {required ? <span className="ml-1 text-[#B42318]">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function VerificationBadge({ status }: { status: string }) {
  const tone =
    status === "verified"
      ? "bg-[#E6F4EF] text-[#0A6A4A]"
      : status === "rejected"
        ? "bg-[#FFECEF] text-[#B42318]"
        : "bg-[#FEF4E6] text-[#A1631A]";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tone}`}>
      {status}
    </span>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}
