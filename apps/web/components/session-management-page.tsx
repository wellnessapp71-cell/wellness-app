"use client";

import type { ComponentType } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, MessageSquare, Mic, Video } from "lucide-react";
import { GlassCard } from "@/components/wellness/glass-card";
import { fetchWithAuth, getDashboardRoute, getStoredAuth, type StoredAuthUser } from "@/lib/client-auth";
import { PortalShell } from "@/components/portal-shell";

interface SessionManagementPageProps {
  requestId: string;
}

interface SessionPayload {
  supportRequest: {
    id: string;
    issueType: string;
    preferredMode: string;
    sessionType: string;
    status: string;
    scheduledFor: string | null;
    meetingUrl: string | null;
    sessionNotes: string | null;
    reason: string | null;
    outcome: string | null;
    user: {
      name: string | null;
      email: string;
    };
    organization: {
      name: string;
    } | null;
    sessionEvents: Array<{
      id: string;
      eventType: string;
      createdAt: string;
    }>;
  };
}

export function SessionManagementPage({ requestId }: SessionManagementPageProps) {
  const router = useRouter();
  const [auth, setAuth] = useState<StoredAuthUser | null>(null);
  const [data, setData] = useState<SessionPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    status: "scheduled",
    scheduledFor: "",
    meetingUrl: "",
    sessionNotes: "",
  });

  async function load() {
    try {
      setError(null);
      const payload = await fetchWithAuth<SessionPayload>(`/api/web/support/${requestId}`);
      setData(payload);
      setForm({
        status: payload.supportRequest.status,
        scheduledFor: payload.supportRequest.scheduledFor
          ? new Date(payload.supportRequest.scheduledFor).toISOString().slice(0, 16)
          : "",
        meetingUrl: payload.supportRequest.meetingUrl ?? "",
        sessionNotes: payload.supportRequest.sessionNotes ?? "",
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load session.");
    }
  }

  useEffect(() => {
    const stored = getStoredAuth();
    if (!stored) {
      router.replace("/login?role=psychologist");
      return;
    }
    if (stored.role !== "psychologist" && stored.role !== "admin") {
      router.replace(getDashboardRoute(stored.role));
      return;
    }
    setAuth(stored);
    void load();
  }, [requestId, router]);

  if (!auth) return null;

  async function saveSession(event: React.FormEvent) {
    event.preventDefault();
    try {
      await fetchWithAuth(`/api/web/support/${requestId}`, {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save session.");
    }
  }

  return (
    <PortalShell
      auth={auth}
      title="Session management"
      subtitle="Coordinate care, update schedule details, and continue the session from the same support record."
    >
      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold tracking-tight text-[#10242A]">
              {data?.supportRequest.user.name ?? data?.supportRequest.user.email}
            </h2>
            <p className="mt-2 text-sm text-[#607883]">
              {data?.supportRequest.organization?.name ?? "Independent user"} • {data?.supportRequest.issueType}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Badge icon={MessageSquare} label={data?.supportRequest.preferredMode ?? "text"} />
              <Badge icon={CalendarClock} label={data?.supportRequest.status ?? "pending"} />
              <Badge icon={Video} label={data?.supportRequest.sessionType ?? "video"} />
            </div>
            <div className="mt-6 space-y-3 text-sm leading-7 text-[#526973]">
              <p><strong className="text-[#10242A]">Reason:</strong> {data?.supportRequest.reason ?? "Not provided"}</p>
              <p><strong className="text-[#10242A]">Desired outcome:</strong> {data?.supportRequest.outcome ?? "Not provided"}</p>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold tracking-tight text-[#10242A]">Session timeline</h2>
            <div className="mt-4 space-y-3">
              {data?.supportRequest.sessionEvents.map((event) => (
                <div key={event.id} className="rounded-[18px] border border-[#E6EEF1] bg-[#FBFDFE] px-4 py-3 text-sm text-[#526973]">
                  <p className="font-semibold text-[#10242A]">{event.eventType}</p>
                  <p className="mt-1">{new Date(event.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold tracking-tight text-[#10242A]">Manage live session</h2>
          <p className="mt-2 text-sm text-[#607883]">
            Schedule the session, attach a join link for audio or video, and keep running notes inside the same record.
          </p>
          <form className="mt-6 space-y-4" onSubmit={saveSession}>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-[#2F4952]">Status</span>
              <select
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                className="rounded-[18px] border border-[#D7E3E7] bg-[#F8FBFC] px-4 py-3 text-sm text-[#17303A] outline-none"
              >
                <option value="accepted">Accepted</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-[#2F4952]">Scheduled for</span>
              <input
                type="datetime-local"
                value={form.scheduledFor}
                onChange={(event) => setForm((current) => ({ ...current, scheduledFor: event.target.value }))}
                className="rounded-[18px] border border-[#D7E3E7] bg-[#F8FBFC] px-4 py-3 text-sm text-[#17303A] outline-none"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-[#2F4952]">Meeting link</span>
              <input
                value={form.meetingUrl}
                onChange={(event) => setForm((current) => ({ ...current, meetingUrl: event.target.value }))}
                placeholder="https://meet.google.com/..."
                className="rounded-[18px] border border-[#D7E3E7] bg-[#F8FBFC] px-4 py-3 text-sm text-[#17303A] outline-none"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-[#2F4952]">Session notes</span>
              <textarea
                rows={8}
                value={form.sessionNotes}
                onChange={(event) => setForm((current) => ({ ...current, sessionNotes: event.target.value }))}
                placeholder="Working notes, follow-ups, observations..."
                className="rounded-[18px] border border-[#D7E3E7] bg-[#F8FBFC] px-4 py-3 text-sm text-[#17303A] outline-none"
              />
            </label>
            {error ? <div className="rounded-[18px] bg-[#FFF5F7] px-4 py-3 text-sm text-[#B42318]">{error}</div> : null}
            <div className="flex flex-wrap gap-3">
              <button className="rounded-[20px] bg-[#10242A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#17303A]">
                Save updates
              </button>
              {form.meetingUrl ? (
                <a
                  href={form.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-[20px] border border-[#CFDADF] px-5 py-3 text-sm font-semibold text-[#17303A] transition hover:bg-white"
                >
                  <Mic className="h-4 w-4" />
                  Launch session
                </a>
              ) : null}
            </div>
          </form>
        </GlassCard>
      </div>
    </PortalShell>
  );
}

function Badge({
  icon: Icon,
  label,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-[#EEF6F7] px-3 py-1 text-xs font-semibold text-[#167C80]">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
