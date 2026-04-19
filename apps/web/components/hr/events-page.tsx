"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Plus, X, Send, Clock, CheckCircle2 } from "lucide-react";
import { GlassCard } from "@/components/wellness/glass-card";
import { fetchWithAuth } from "@/lib/client-auth";
import { PageHeader } from "@/components/portal-nav-shell";

interface EventRow {
  id: string;
  title: string;
  body: string;
  audienceType: string;
  channels: string[];
  startTime: string;
  endTime: string | null;
  status: string;
  emergency: boolean;
  createdBy: { id: string; name: string | null; email: string } | null;
  createdAt: string;
}

interface ListResponse {
  notifications: EventRow[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-[#EAF4FF] text-[#0F6FFF]",
  sent: "bg-[#E6F5EC] text-[#0A6D33]",
  cancelled: "bg-[#F0F0F0] text-[#56707B]",
  active: "bg-[#FFF6E0] text-[#9A6A00]",
};

export function EventsCalendarPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1);

  const [form, setForm] = useState({
    title: "",
    body: "",
    audienceType: "all",
    channels: ["in_app"],
    startTime: "",
    endTime: "",
    emergency: false,
  });

  async function load(p = page) {
    try {
      setError(null);
      const params = new URLSearchParams({ page: String(p), limit: "25" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetchWithAuth<{ data: ListResponse }>(`/api/web/hr/notifications?${params}`);
      setData(res.data);
    } catch {
      setError("Failed to load events.");
    }
  }

  useEffect(() => { load(); }, [page, statusFilter]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await fetchWithAuth("/api/web/hr/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          startTime: new Date(form.startTime).toISOString(),
          endTime: form.endTime ? new Date(form.endTime).toISOString() : undefined,
        }),
      });
      setShowCreate(false);
      setForm({ title: "", body: "", audienceType: "all", channels: ["in_app"], startTime: "", endTime: "", emergency: false });
      load();
    } catch {
      setError("Failed to create event.");
    } finally {
      setBusy(false);
    }
  }

  function toggleChannel(ch: string) {
    setForm((f) => ({
      ...f,
      channels: f.channels.includes(ch) ? f.channels.filter((c) => c !== ch) : [...f.channels, ch],
    }));
  }

  return (
    <>
      <PageHeader title="Live Events Calendar" subtitle="Schedule and track webinars, live sessions, and org-wide notifications." />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-1 bg-[#10242A] rounded-[14px] p-1">
          {["all", "scheduled", "active", "sent", "cancelled"].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-[10px] text-xs font-medium capitalize transition-colors ${statusFilter === s ? "bg-[#167C80] text-white" : "text-[#56707B] hover:text-white"}`}
            >
              {s}
            </button>
          ))}
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="ml-auto flex items-center gap-1 bg-[#167C80] hover:bg-[#167C80]/80 text-white px-4 py-2 rounded-[14px] text-sm font-medium transition-colors">
          {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreate ? "Cancel" : "New Event"}
        </button>
      </div>

      {error && <div className="bg-[#FFE6EA]/10 border border-[#B42318]/30 text-[#B42318] rounded-[14px] p-4 mb-6">{error}</div>}

      {showCreate && (
        <GlassCard className="mb-6">
          <h3 className="text-sm font-semibold text-white mb-4">Schedule New Event</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" required placeholder="Event title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="bg-[#10242A] border border-[#56707B]/30 rounded-[14px] px-3 py-2 text-sm text-white col-span-full" />
            <textarea required placeholder="Description / message body" value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} className="bg-[#10242A] border border-[#56707B]/30 rounded-[14px] px-3 py-2 text-sm text-white col-span-full" rows={3} />
            <div>
              <label className="text-xs text-[#56707B] mb-1 block">Start Time</label>
              <input type="datetime-local" required value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} className="w-full bg-[#10242A] border border-[#56707B]/30 rounded-[14px] px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-[#56707B] mb-1 block">End Time (optional)</label>
              <input type="datetime-local" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} className="w-full bg-[#10242A] border border-[#56707B]/30 rounded-[14px] px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-[#56707B] mb-1 block">Audience</label>
              <select value={form.audienceType} onChange={(e) => setForm((f) => ({ ...f, audienceType: e.target.value }))} className="w-full bg-[#10242A] border border-[#56707B]/30 rounded-[14px] px-3 py-2 text-sm text-white">
                <option value="all">All Employees</option>
                <option value="department">Department</option>
                <option value="group">Group</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[#56707B] mb-1 block">Channels</label>
              <div className="flex gap-2">
                {["in_app", "email", "push"].map((ch) => (
                  <button key={ch} type="button" onClick={() => toggleChannel(ch)} className={`px-3 py-1.5 rounded-[10px] text-xs font-medium transition-colors ${form.channels.includes(ch) ? "bg-[#167C80] text-white" : "bg-[#10242A] text-[#56707B] border border-[#56707B]/30"}`}>
                    {ch.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-span-full flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                <input type="checkbox" checked={form.emergency} onChange={(e) => setForm((f) => ({ ...f, emergency: e.target.checked }))} className="rounded" />
                Emergency broadcast
              </label>
              <button type="submit" disabled={busy} className="ml-auto flex items-center gap-1 bg-[#167C80] hover:bg-[#167C80]/80 text-white px-4 py-2 rounded-[14px] text-sm font-medium transition-colors disabled:opacity-50">
                <Send className="w-4 h-4" /> Schedule
              </button>
            </div>
          </form>
        </GlassCard>
      )}

      {data && (
        <div className="space-y-3">
          {data.notifications.length === 0 && (
            <GlassCard><p className="text-[#56707B] text-center py-8">No events found.</p></GlassCard>
          )}
          {data.notifications.map((ev) => (
            <GlassCard key={ev.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <CalendarClock className="w-5 h-5 text-[#167C80] mt-0.5 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{ev.title}</span>
                      {ev.emergency && <span className="bg-[#FFE6EA] text-[#B42318] px-2 py-0.5 rounded-full text-xs font-medium">Emergency</span>}
                    </div>
                    <p className="text-xs text-[#56707B] mt-1 line-clamp-2">{ev.body}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-[#56707B]">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(ev.startTime).toLocaleString()}</span>
                      {ev.endTime && <span>→ {new Date(ev.endTime).toLocaleString()}</span>}
                      <span>Audience: {ev.audienceType}</span>
                      <span>Channels: {(ev.channels ?? []).join(", ")}</span>
                    </div>
                  </div>
                </div>
                <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[ev.status] ?? "bg-[#1a3a44] text-[#56707B]"}`}>
                  {ev.status}
                </span>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </>
  );
}
