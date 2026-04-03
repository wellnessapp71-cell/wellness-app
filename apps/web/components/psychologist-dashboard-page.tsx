"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, MessageSquareHeart, Stethoscope, Video } from "lucide-react";
import { GlassCard } from "@/components/wellness/glass-card";
import { fetchWithAuth, getDashboardRoute, getStoredAuth, type StoredAuthUser } from "@/lib/client-auth";
import { PortalShell } from "@/components/portal-shell";

interface PsychologistDashboardPayload {
  profile: {
    verificationStatus: string;
    specialties: string[];
    sessionModes: string[];
    yearsExperience: number;
    education: string;
  };
  openRequests: SessionCard[];
  acceptedRequests: SessionCard[];
}

interface SessionCard {
  id: string;
  employeeName: string;
  organizationName: string;
  issueType: string;
  preferredMode: string;
  sessionType: string;
  status: string;
  language: string | null;
  style: string | null;
  reason: string | null;
  outcome: string | null;
  wellbeingAverage: number | null;
  sleepHours: number | null;
  scheduledFor: string | null;
  requestedAt: string;
}

export function PsychologistDashboardPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<StoredAuthUser | null>(null);
  const [data, setData] = useState<PsychologistDashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setError(null);
      const payload = await fetchWithAuth<PsychologistDashboardPayload>("/api/web/dashboard/psychologist");
      setData(payload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load psychologist dashboard.");
    }
  }

  useEffect(() => {
    const stored = getStoredAuth();
    if (!stored) {
      router.replace("/login?role=psychologist");
      return;
    }
    if (stored.role !== "psychologist") {
      router.replace(getDashboardRoute(stored.role));
      return;
    }
    setAuth(stored);
    void load();
    const interval = window.setInterval(() => {
      void load();
    }, 30000);
    return () => window.clearInterval(interval);
  }, [router]);

  if (!auth) return null;

  async function acceptRequest(id: string) {
    try {
      await fetchWithAuth(`/api/web/support/${id}/accept`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      await load();
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : "Unable to accept request.");
    }
  }

  return (
    <PortalShell
      auth={auth}
      title="Psychologist operations desk"
      subtitle="Review open sessions, accept support requests, and manage booked care with shared employee context."
    >
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <GlassCard className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F97316]/10 text-[#F97316]">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-[#10242A]">Professional profile</h2>
                <p className="mt-1 text-sm text-[#607883]">Live from shared credential onboarding.</p>
              </div>
            </div>
            <div className="space-y-3 text-sm text-[#526973]">
              <p><strong className="text-[#10242A]">Verification:</strong> {data?.profile.verificationStatus ?? "pending"}</p>
              <p><strong className="text-[#10242A]">Experience:</strong> {data?.profile.yearsExperience ?? 0} years</p>
              <p><strong className="text-[#10242A]">Education:</strong> {data?.profile.education ?? "—"}</p>
              <p><strong className="text-[#10242A]">Specialties:</strong> {(data?.profile.specialties ?? []).join(", ")}</p>
              <p><strong className="text-[#10242A]">Session modes:</strong> {(data?.profile.sessionModes ?? []).join(", ")}</p>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0F6FFF]/10 text-[#0F6FFF]">
                <CalendarClock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-[#10242A]">Accepted sessions</h2>
                <p className="mt-1 text-sm text-[#607883]">Booked or active care assignments.</p>
              </div>
            </div>
            <div className="space-y-3">
              {data?.acceptedRequests.map((request) => (
                <SessionListCard key={request.id} request={request} showAccept={false} />
              ))}
            </div>
          </GlassCard>
        </div>

        <GlassCard className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#167C80]/10 text-[#167C80]">
              <MessageSquareHeart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-[#10242A]">Open support requests</h2>
              <p className="mt-1 text-sm text-[#607883]">Accept a request to allocate yourself and move it into care.</p>
            </div>
          </div>
          {error ? <div className="mb-4 rounded-[18px] bg-[#FFF5F7] px-4 py-3 text-sm text-[#B42318]">{error}</div> : null}
          <div className="space-y-4">
            {data?.openRequests.map((request) => (
              <SessionListCard
                key={request.id}
                request={request}
                showAccept
                onAccept={() => void acceptRequest(request.id)}
              />
            ))}
          </div>
        </GlassCard>
      </div>
    </PortalShell>
  );
}

function SessionListCard({
  request,
  showAccept,
  onAccept,
}: {
  request: SessionCard;
  showAccept: boolean;
  onAccept?: () => void;
}) {
  return (
    <div className="rounded-[24px] border border-[#E6EEF1] bg-[#FBFDFE] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-lg font-semibold text-[#10242A]">{request.employeeName}</p>
          <p className="mt-1 text-sm text-[#607883]">{request.organizationName}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge label={request.issueType} />
            <Badge label={request.preferredMode} />
            <Badge label={request.sessionType} />
            {request.wellbeingAverage !== null ? <Badge label={`Wellbeing ${request.wellbeingAverage}`} /> : null}
          </div>
          {(request.reason || request.outcome) ? (
            <p className="mt-3 text-sm leading-6 text-[#526973]">
              {request.reason ?? request.outcome}
            </p>
          ) : null}
          <p className="mt-2 text-xs text-[#7B919B]">
            {request.language ?? "Any language"} • {request.style ?? "Any style"} • sleep {request.sleepHours ?? "—"}h
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 lg:items-end">
          <div className="rounded-full bg-[#EEF6F7] px-3 py-1 text-xs font-semibold text-[#167C80]">{request.status}</div>
          {request.scheduledFor ? (
            <div className="inline-flex items-center gap-2 text-sm text-[#526973]">
              <Video className="h-4 w-4 text-[#0F6FFF]" />
              {new Date(request.scheduledFor).toLocaleString()}
            </div>
          ) : null}
          <div className="flex gap-2">
            <a
              href={`/psychologist/sessions/${request.id}`}
              className="rounded-full border border-[#D6E2E6] px-4 py-2 text-sm font-semibold text-[#17303A] transition hover:bg-white"
            >
              Manage
            </a>
            {showAccept && onAccept ? (
              <button
                onClick={onAccept}
                className="rounded-full bg-[#10242A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#17303A]"
              >
                Accept session
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return <span className="rounded-full bg-[#EEF6F7] px-3 py-1 text-xs font-semibold text-[#167C80]">{label}</span>;
}
