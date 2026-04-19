"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, KeyRound, RefreshCw, XCircle } from "lucide-react";
import { GlassCard } from "@/components/wellness/glass-card";
import { fetchWithAuth } from "@/lib/client-auth";
import { PageHeader } from "@/components/portal-nav-shell";

interface Organization {
  id: string;
  name: string;
  referralCode: string;
}

interface ReferralCode {
  id: string;
  code: string;
  organization: Organization | null;
  hrName: string;
  hrEmail: string;
  hrPhone: string | null;
  role: string | null;
  departmentScope: unknown;
  purpose: string | null;
  status: string;
  expiresAt: string | null;
  createdAt: string;
}

interface ListResponse {
  codes: ReferralCode[];
}
interface OrgsResponse {
  organizations: Array<{ id: string; name: string; referralCode: string }>;
}

const DEFAULT_FORM = {
  organizationId: "",
  hrName: "",
  hrEmail: "",
  hrPhone: "",
  role: "",
  purpose: "",
  expiresAt: "",
  departmentScope: "",
};

export function ReferralCodesPage() {
  const [codes, setCodes] = useState<ReferralCode[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    try {
      setError(null);
      const [codesRes, orgsRes] = await Promise.all([
        fetchWithAuth<ListResponse>("/api/web/admin/referral-codes"),
        fetchWithAuth<OrgsResponse>("/api/web/organizations"),
      ]);
      setCodes(codesRes.codes);
      setOrganizations(orgsRes.organizations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load referral codes.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return codes;
    return codes.filter((c) => c.status === statusFilter);
  }, [codes, statusFilter]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      setError(null);
      const body: Record<string, unknown> = {
        organizationId: form.organizationId,
        hrName: form.hrName.trim(),
        hrEmail: form.hrEmail.trim(),
      };
      if (form.hrPhone.trim()) body.hrPhone = form.hrPhone.trim();
      if (form.role.trim()) body.role = form.role.trim();
      if (form.purpose.trim()) body.purpose = form.purpose.trim();
      if (form.expiresAt) body.expiresAt = new Date(form.expiresAt).toISOString();
      if (form.departmentScope.trim()) {
        body.departmentScope = form.departmentScope
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      await fetchWithAuth("/api/web/admin/referral-codes", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setForm(DEFAULT_FORM);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create referral code.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAction(id: string, action: "revoke" | "reissue") {
    try {
      await fetchWithAuth(`/api/web/admin/referral-codes/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    }
  }

  return (
    <>
      <PageHeader
        title="HR Referral Codes"
        subtitle="Issue, reissue, and revoke per-HR referral codes with access expiry and scope."
      />
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <GlassCard className="p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight text-[#10242A]">Issued codes</h2>
            <div className="flex gap-1 rounded-full bg-[#EEF2F4] p-1">
              {["all", "active", "revoked", "expired"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${
                    statusFilter === s ? "bg-white text-[#10242A] shadow-sm" : "text-[#56707B]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <p className="rounded-[18px] bg-[#F6F9FA] p-6 text-center text-sm text-[#56707B]">
                No referral codes yet.
              </p>
            ) : null}
            {filtered.map((code) => (
              <div
                key={code.id}
                className="rounded-[22px] border border-[#E6EEF1] bg-[#FBFDFE] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-[#167C80]" />
                      <span className="font-mono text-sm font-semibold text-[#10242A]">{code.code}</span>
                      <button
                        onClick={() => void navigator.clipboard.writeText(code.code)}
                        className="text-[#56707B] hover:text-[#10242A]"
                        aria-label="Copy code"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <StatusBadge status={code.status} />
                    </div>
                    <p className="mt-1 text-sm font-semibold text-[#17303A]">{code.hrName}</p>
                    <p className="text-xs text-[#56707B]">
                      {code.hrEmail}
                      {code.hrPhone ? ` • ${code.hrPhone}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-[#56707B]">
                      {code.organization?.name ?? "—"}
                      {code.role ? ` • ${code.role}` : ""}
                      {code.expiresAt ? ` • expires ${formatDate(code.expiresAt)}` : ""}
                    </p>
                    {code.purpose ? (
                      <p className="mt-2 text-xs italic text-[#607883]">{code.purpose}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => void handleAction(code.id, "reissue")}
                      disabled={code.status !== "active"}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#D7E3E7] px-3 py-1.5 text-xs font-semibold text-[#17303A] transition hover:bg-white disabled:opacity-40"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Reissue
                    </button>
                    <button
                      onClick={() => void handleAction(code.id, "revoke")}
                      disabled={code.status !== "active"}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#F1D2D9] px-3 py-1.5 text-xs font-semibold text-[#B42318] transition hover:bg-[#FFF5F7] disabled:opacity-40"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Revoke
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold tracking-tight text-[#10242A]">Issue new code</h2>
          <p className="mt-1 text-sm text-[#607883]">
            Details are stored with the code and audit-logged.
          </p>
          <form className="mt-5 space-y-3" onSubmit={handleCreate}>
            <Field label="Organization" required>
              <select
                value={form.organizationId}
                onChange={(e) => setForm((f) => ({ ...f, organizationId: e.target.value }))}
                required
                className={fieldClass}
              >
                <option value="">Select organization…</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="HR full name" required>
              <input
                value={form.hrName}
                onChange={(e) => setForm((f) => ({ ...f, hrName: e.target.value }))}
                required
                className={fieldClass}
              />
            </Field>
            <Field label="HR email" required>
              <input
                type="email"
                value={form.hrEmail}
                onChange={(e) => setForm((f) => ({ ...f, hrEmail: e.target.value }))}
                required
                className={fieldClass}
              />
            </Field>
            <Field label="HR phone">
              <input
                value={form.hrPhone}
                onChange={(e) => setForm((f) => ({ ...f, hrPhone: e.target.value }))}
                className={fieldClass}
              />
            </Field>
            <Field label="Role / job title">
              <input
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className={fieldClass}
              />
            </Field>
            <Field label="Department scope (comma-separated)">
              <input
                value={form.departmentScope}
                onChange={(e) => setForm((f) => ({ ...f, departmentScope: e.target.value }))}
                placeholder="Engineering, Product"
                className={fieldClass}
              />
            </Field>
            <Field label="Access expiry">
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                className={fieldClass}
              />
            </Field>
            <Field label="Purpose">
              <textarea
                rows={2}
                value={form.purpose}
                onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
                className={fieldClass}
              />
            </Field>

            {error ? (
              <div className="rounded-[16px] bg-[#FFF5F7] px-4 py-3 text-sm text-[#B42318]">{error}</div>
            ) : null}
            <button
              disabled={submitting}
              className="w-full rounded-[18px] bg-[#10242A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#17303A] disabled:opacity-50"
            >
              {submitting ? "Issuing…" : "Issue referral code"}
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

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "active"
      ? "bg-[#E6F4EF] text-[#0A6A4A]"
      : status === "revoked"
        ? "bg-[#FFECEF] text-[#B42318]"
        : status === "expired"
          ? "bg-[#FEF4E6] text-[#A1631A]"
          : "bg-[#EEF2F4] text-[#56707B]";
  return (
    <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tone}`}>
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
