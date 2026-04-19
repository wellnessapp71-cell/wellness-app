"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/portal-nav-shell";
import { GlassCard } from "@/components/wellness/glass-card";
import { fetchWithAuth } from "@/lib/client-auth";

interface ProfileData {
  user: { id: string; name: string | null; email: string; username: string; referralCode: string };
  organizations: Array<{ organization: { id: string; name: string; referralCode: string } }>;
}

export default function EmployeeProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const result = await fetchWithAuth<ProfileData>("/api/profile");
        setData(result);
        setName(result.user.name ?? "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile.");
      }
    })();
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await fetchWithAuth("/api/profile", { method: "POST", body: JSON.stringify({ name }) });
      setSuccess("Profile updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Your profile" subtitle="Keep your personal details up to date." />
      {error && <Banner tone="error">{error}</Banner>}
      {success && <Banner tone="success">{success}</Banner>}

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <h2 className="text-base font-semibold text-[#10242A]">Personal details</h2>
          <div className="mt-5 space-y-4">
            <Field label="Full name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-[#CFDADF] bg-white px-4 py-2.5 text-sm text-[#10242A] outline-none transition focus:border-[#167C80]"
                placeholder="Your name"
              />
            </Field>
            <Field label="Email">
              <ReadOnly value={data?.user.email ?? "—"} />
            </Field>
            <Field label="Username">
              <ReadOnly value={data?.user.username ?? "—"} />
            </Field>
            <Field label="Your referral code">
              <ReadOnly value={data?.user.referralCode ?? "—"} />
            </Field>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="mt-6 inline-flex items-center rounded-full bg-[#10242A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#17303A] disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-base font-semibold text-[#10242A]">Organizations</h2>
          <p className="mt-1 text-sm text-[#56707B]">Workspaces you belong to.</p>
          <div className="mt-5 space-y-3">
            {data?.organizations?.length ? (
              data.organizations.map((m) => (
                <div
                  key={m.organization.id}
                  className="rounded-2xl border border-[#E8EEF0] bg-white p-4"
                >
                  <p className="text-sm font-semibold text-[#10242A]">{m.organization.name}</p>
                  <p className="mt-1 text-xs text-[#56707B]">Code: {m.organization.referralCode}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#56707B]">No organization yet.</p>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#56707B]">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function ReadOnly({ value }: { value: string }) {
  return (
    <div className="w-full rounded-2xl border border-[#E8EEF0] bg-[#F7FBFC] px-4 py-2.5 text-sm text-[#10242A]">
      {value}
    </div>
  );
}

function Banner({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  const cls =
    tone === "error"
      ? "border-[#F4C6CD] bg-[#FFF5F7] text-[#B42318]"
      : "border-[#BCE3CF] bg-[#ECFDF3] text-[#027A48]";
  return <div className={`mb-6 rounded-[20px] border px-5 py-4 text-sm ${cls}`}>{children}</div>;
}
