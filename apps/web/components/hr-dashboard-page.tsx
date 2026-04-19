"use client";

import { useEffect, useState } from "react";
import { BellRing, BrainCircuit, HeartPulse, Sparkles, Users } from "lucide-react";
import { GlassCard } from "@/components/wellness/glass-card";
import { fetchWithAuth } from "@/lib/client-auth";
import { PageHeader } from "@/components/portal-nav-shell";

interface HrDashboardPayload {
  organization: {
    name: string;
    referralCode: string;
    industry: string | null;
    companySize: number | null;
  };
  metrics: {
    employeeCount: number;
    averageMental: number;
    averagePhysical: number;
    averageSpiritual: number;
    averageLifestyle: number;
  };
  employees: Array<{
    userId: string;
    name: string | null;
    email: string;
    department: string | null;
    title: string | null;
    profileSummary: {
      age: number;
      gender: string;
      activityLevel: string | null;
      sleepHours: number | null;
      updatedAt: string;
    } | null;
    scores: {
      mental: number;
      physical: number;
      spiritual: number;
      lifestyle: number;
      wellbeingAverage: number | null;
    } | null;
  }>;
  webinars: Array<{
    id: string;
    title: string;
    scheduledFor: string;
    deliveryStatus: string;
  }>;
  supportRequests: Array<{
    id: string;
    employeeName: string | null;
    status: string;
    issueType: string;
    sessionType: string;
    preferredMode: string;
    language: string | null;
    reason: string | null;
    outcome: string | null;
    scheduledFor: string | null;
    psychologistName: string | null;
  }>;
}

export function HrDashboardPage() {
  const [data, setData] = useState<HrDashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [webinar, setWebinar] = useState({
    title: "",
    message: "",
    scheduledFor: "",
  });

  async function load() {
    try {
      setError(null);
      const payload = await fetchWithAuth<HrDashboardPayload>("/api/web/dashboard/hr");
      setData(payload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load HR dashboard.");
    }
  }

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => {
      void load();
    }, 30000);
    return () => window.clearInterval(interval);
  }, []);

  async function handleCreateWebinar(event: React.FormEvent) {
    event.preventDefault();
    try {
      await fetchWithAuth("/api/web/webinars", {
        method: "POST",
        body: JSON.stringify(webinar),
      });
      setWebinar({ title: "", message: "", scheduledFor: "" });
      await load();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create webinar.");
    }
  }

  return (
    <>
      <PageHeader
        title={data?.organization.name ?? "HR workspace"}
        subtitle="Push webinars, monitor wellbeing signals, and stay ahead of employee support needs."
      />
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: "Employees", value: data?.metrics.employeeCount ?? 0, icon: Users, tone: "text-[#167C80] bg-[#167C80]/10" },
              { label: "Mental", value: data?.metrics.averageMental ?? 0, icon: BrainCircuit, tone: "text-[#0F6FFF] bg-[#0F6FFF]/10" },
              { label: "Physical", value: data?.metrics.averagePhysical ?? 0, icon: HeartPulse, tone: "text-[#F97316] bg-[#F97316]/10" },
              { label: "Spiritual", value: data?.metrics.averageSpiritual ?? 0, icon: Sparkles, tone: "text-[#7C3AED] bg-[#7C3AED]/10" },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <GlassCard key={card.label} className="p-5">
                  <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${card.tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-3xl font-semibold tracking-tight text-[#10242A]">{card.value}</div>
                  <div className="mt-2 text-sm text-[#5F7580]">{card.label} avg</div>
                </GlassCard>
              );
            })}
          </div>

          <GlassCard className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-[#10242A]">Employee insight board</h2>
                <p className="mt-1 text-sm text-[#607883]">
                  Referral code {data?.organization.referralCode ?? "—"} • shared live data from the employee app.
                </p>
              </div>
              <div className="rounded-full bg-[#EEF6F7] px-4 py-2 text-xs font-semibold text-[#167C80]">
                {data?.organization.industry ?? "General"}
              </div>
            </div>

            <div className="space-y-4">
              {data?.employees.map((employee) => (
                <div key={employee.userId} className="rounded-[24px] border border-[#E6EEF1] bg-[#FBFDFE] p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-[#10242A]">{employee.name ?? employee.email}</p>
                      <p className="mt-1 text-sm text-[#607883]">
                        {employee.department ?? "Unassigned"} • {employee.title ?? "Employee"}
                      </p>
                      {employee.profileSummary ? (
                        <p className="mt-1 text-xs text-[#7B919B]">
                          {employee.profileSummary.age} yrs • {employee.profileSummary.gender} • {employee.profileSummary.activityLevel ?? "activity n/a"} • sleep {employee.profileSummary.sleepHours ?? "—"}h
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {employee.scores ? (
                        <>
                          <Badge label={`Mental ${employee.scores.mental}`} />
                          <Badge label={`Physical ${employee.scores.physical}`} />
                          <Badge label={`Spiritual ${employee.scores.spiritual}`} />
                          <Badge label={`Lifestyle ${employee.scores.lifestyle}`} />
                        </>
                      ) : (
                        <Badge label="No profile yet" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        <div className="space-y-6">
          <GlassCard className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0F6FFF]/10 text-[#0F6FFF]">
                <BellRing className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-[#10242A]">Push webinar notification</h2>
                <p className="mt-1 text-sm text-[#607883]">Broadcast education and support events to employees.</p>
              </div>
            </div>
            <form className="space-y-4" onSubmit={handleCreateWebinar}>
              <input
                value={webinar.title}
                onChange={(event) => setWebinar((current) => ({ ...current, title: event.target.value }))}
                placeholder="Webinar title"
                className="w-full rounded-[18px] border border-[#D7E3E7] bg-[#F8FBFC] px-4 py-3 text-sm text-[#17303A] outline-none transition focus:border-[#167C80] focus:bg-white"
              />
              <textarea
                value={webinar.message}
                onChange={(event) => setWebinar((current) => ({ ...current, message: event.target.value }))}
                placeholder="What should employees know?"
                rows={4}
                className="w-full rounded-[18px] border border-[#D7E3E7] bg-[#F8FBFC] px-4 py-3 text-sm text-[#17303A] outline-none transition focus:border-[#167C80] focus:bg-white"
              />
              <input
                type="datetime-local"
                value={webinar.scheduledFor}
                onChange={(event) => setWebinar((current) => ({ ...current, scheduledFor: event.target.value }))}
                className="w-full rounded-[18px] border border-[#D7E3E7] bg-[#F8FBFC] px-4 py-3 text-sm text-[#17303A] outline-none transition focus:border-[#167C80] focus:bg-white"
              />
              {error ? <div className="rounded-[18px] bg-[#FFF5F7] px-4 py-3 text-sm text-[#B42318]">{error}</div> : null}
              <button className="w-full rounded-[20px] bg-[#10242A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#17303A]">
                Schedule notification
              </button>
            </form>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold tracking-tight text-[#10242A]">Support queue</h2>
            <div className="mt-4 space-y-3">
              {data?.supportRequests.map((request) => (
                <div key={request.id} className="rounded-[20px] border border-[#E6EEF1] bg-[#FBFDFE] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#10242A]">{request.employeeName ?? "Employee"}</p>
                      <p className="text-sm text-[#607883]">
                        {request.issueType} • {request.preferredMode}
                      </p>
                    </div>
                    <Badge label={request.status} />
                  </div>
                  <p className="mt-2 text-sm text-[#607883]">
                    Psychologist: {request.psychologistName ?? "Awaiting assignment"}
                  </p>
                  {(request.reason || request.outcome) ? (
                    <p className="mt-2 text-sm text-[#526973]">
                      {request.reason ?? request.outcome}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </>
  );
}

function Badge({ label }: { label: string }) {
  return <span className="rounded-full bg-[#EEF6F7] px-3 py-1 text-xs font-semibold text-[#167C80]">{label}</span>;
}
