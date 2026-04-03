"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Hospital, ShieldPlus, Trash2, Users } from "lucide-react";
import { GlassCard } from "@/components/wellness/glass-card";
import { fetchWithAuth, getDashboardRoute, getStoredAuth, type StoredAuthUser } from "@/lib/client-auth";
import { PortalShell } from "@/components/portal-shell";

interface AdminDashboardPayload {
  stats: {
    organizationCount: number;
    employeeCount: number;
    psychologistCount: number;
    pendingSessionCount: number;
  };
  organizations: Array<{
    id: string;
    name: string;
    referralCode: string;
    industry: string | null;
    companySize: number | null;
    active: boolean;
    employeeCount: number;
    hrCount: number;
    latestWebinar: { title: string; scheduledFor: string; deliveryStatus: string } | null;
  }>;
}

export function AdminPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<StoredAuthUser | null>(null);
  const [data, setData] = useState<AdminDashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    industry: "",
    companySize: "",
    website: "",
    contactEmail: "",
    contactPhone: "",
  });

  async function load() {
    try {
      setError(null);
      const payload = await fetchWithAuth<AdminDashboardPayload>("/api/web/dashboard/admin");
      setData(payload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard.");
    }
  }

  useEffect(() => {
    const stored = getStoredAuth();
    if (!stored) {
      router.replace("/login?role=admin");
      return;
    }
    if (stored.role !== "admin") {
      router.replace(getDashboardRoute(stored.role));
      return;
    }
    setAuth(stored);
    void load();
  }, [router]);

  if (!auth) return null;

  async function handleCreateOrganization(event: React.FormEvent) {
    event.preventDefault();
    try {
      setError(null);
      await fetchWithAuth("/api/web/organizations", {
        method: "POST",
        body: JSON.stringify(buildOrganizationPayload(form)),
      });
      setForm({ name: "", industry: "", companySize: "", website: "", contactEmail: "", contactPhone: "" });
      await load();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create organization.");
    }
  }

  async function handleDeleteOrganization(id: string) {
    try {
      await fetchWithAuth(`/api/web/organizations/${id}`, { method: "DELETE" });
      await load();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete organization.");
    }
  }

  return (
    <PortalShell
      auth={auth}
      title="Admin command center"
      subtitle="Oversee organizations, referral onboarding, employee coverage, and the support queue."
    >
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: "Organizations", value: data?.stats.organizationCount ?? 0, icon: Building2 },
              { label: "Employees", value: data?.stats.employeeCount ?? 0, icon: Users },
              { label: "Psychologists", value: data?.stats.psychologistCount ?? 0, icon: Hospital },
              { label: "Pending sessions", value: data?.stats.pendingSessionCount ?? 0, icon: ShieldPlus },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <GlassCard key={card.label} className="p-5">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#167C80]/10 text-[#167C80]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-3xl font-semibold tracking-tight text-[#10242A]">{card.value}</div>
                  <div className="mt-2 text-sm text-[#5F7580]">{card.label}</div>
                </GlassCard>
              );
            })}
          </div>

          <GlassCard className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-[#10242A]">Organizations</h2>
                <p className="mt-1 text-sm text-[#607883]">Manage referral-code-based rollout across companies.</p>
              </div>
            </div>
            <div className="space-y-4">
              {data?.organizations.map((organization) => (
                <div
                  key={organization.id}
                  className="flex flex-col gap-4 rounded-[24px] border border-[#E6EEF1] bg-[#FBFDFE] p-5 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div>
                    <p className="text-lg font-semibold text-[#10242A]">{organization.name}</p>
                    <p className="mt-1 text-sm text-[#607883]">
                      {organization.industry ?? "General"} • Referral {organization.referralCode}
                    </p>
                    <p className="mt-2 text-sm text-[#607883]">
                      {organization.employeeCount} employees • {organization.hrCount} HR admins
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {organization.latestWebinar ? (
                      <div className="rounded-full bg-[#EAF4FF] px-4 py-2 text-xs font-semibold text-[#0F6FFF]">
                        Webinar: {organization.latestWebinar.title}
                      </div>
                    ) : null}
                    <button
                      onClick={() => void handleDeleteOrganization(organization.id)}
                      className="inline-flex items-center gap-2 rounded-full border border-[#F1D2D9] px-4 py-2 text-sm font-semibold text-[#B42318] transition hover:bg-[#FFF5F7]"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold tracking-tight text-[#10242A]">Add organization</h2>
          <p className="mt-2 text-sm text-[#607883]">Create a new company workspace and issue a unique referral code.</p>
          <form className="mt-6 space-y-4" onSubmit={handleCreateOrganization}>
            {[
              ["name", "Company name"],
              ["industry", "Industry"],
              ["companySize", "Company size"],
              ["website", "Website"],
              ["contactEmail", "Contact email"],
              ["contactPhone", "Contact phone"],
            ].map(([key, label]) => (
              <label key={key} className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-[#2F4952]">{label}</span>
                <input
                  value={form[key as keyof typeof form]}
                  onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                  className="rounded-[18px] border border-[#D7E3E7] bg-[#F8FBFC] px-4 py-3 text-sm text-[#17303A] outline-none transition focus:border-[#167C80] focus:bg-white"
                />
              </label>
            ))}
            {error ? <div className="rounded-[18px] bg-[#FFF5F7] px-4 py-3 text-sm text-[#B42318]">{error}</div> : null}
            <button className="w-full rounded-[20px] bg-[#10242A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#17303A]">
              Create organization
            </button>
          </form>
        </GlassCard>
      </div>
    </PortalShell>
  );
}

function buildOrganizationPayload(form: {
  name: string;
  industry: string;
  companySize: string;
  website: string;
  contactEmail: string;
  contactPhone: string;
}) {
  return {
    name: form.name.trim(),
    ...(form.industry.trim() ? { industry: form.industry.trim() } : {}),
    ...(form.companySize.trim() ? { companySize: Number(form.companySize.trim()) } : {}),
    ...(form.website.trim() ? { website: form.website.trim() } : {}),
    ...(form.contactEmail.trim() ? { contactEmail: form.contactEmail.trim() } : {}),
    ...(form.contactPhone.trim() ? { contactPhone: form.contactPhone.trim() } : {}),
  };
}
