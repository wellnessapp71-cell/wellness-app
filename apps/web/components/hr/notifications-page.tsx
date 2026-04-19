"use client";

import { useEffect, useState } from "react";
import { BellRing, Send, Clock, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { GlassCard } from "@/components/wellness/glass-card";
import { fetchWithAuth } from "@/lib/client-auth";
import { PageHeader } from "@/components/portal-nav-shell";

interface NotificationRow {
  id: string;
  title: string;
  body: string;
  audienceType: string;
  audience: unknown;
  channels: string[];
  startTime: string;
  endTime: string | null;
  status: string;
  emergency: boolean;
  createdBy: { id: string; name: string | null; email: string } | null;
  createdAt: string;
}

interface ListResponse {
  notifications: NotificationRow[];
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

export function NotificationsPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  async function load(p = page) {
    try {
      setError(null);
      const params = new URLSearchParams({ page: String(p), limit: "25" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetchWithAuth<{ data: ListResponse }>(`/api/web/hr/notifications?${params}`);
      setData(res.data);
    } catch {
      setError("Failed to load notifications.");
    }
  }

  useEffect(() => { load(); }, [page, statusFilter]);

  return (
    <>
      <PageHeader title="Notifications" subtitle="Outbound notifications sent to employees, with audience and delivery status." />

      <div className="flex gap-1 bg-[#10242A] rounded-[14px] p-1 mb-6 w-fit">
        {["all", "scheduled", "active", "sent", "cancelled"].map((s) => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className={`px-3 py-1.5 rounded-[10px] text-xs font-medium capitalize transition-colors ${statusFilter === s ? "bg-[#167C80] text-white" : "text-[#56707B] hover:text-white"}`}>
            {s}
          </button>
        ))}
      </div>

      {error && <div className="bg-[#FFE6EA]/10 border border-[#B42318]/30 text-[#B42318] rounded-[14px] p-4 mb-6">{error}</div>}

      {data && (
        <div className="space-y-3">
          {data.notifications.length === 0 && (
            <GlassCard><p className="text-[#56707B] text-center py-8">No notifications found.</p></GlassCard>
          )}
          {data.notifications.map((n) => (
            <GlassCard key={n.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <BellRing className="w-5 h-5 text-[#167C80] mt-0.5 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-white">{n.title}</span>
                      {n.emergency && <span className="bg-[#FFE6EA] text-[#B42318] px-2 py-0.5 rounded-full text-xs font-medium">Emergency</span>}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[n.status] ?? "bg-[#1a3a44] text-[#56707B]"}`}>{n.status}</span>
                    </div>
                    <p className="text-xs text-[#56707B] mt-1 line-clamp-2">{n.body}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-[#56707B]">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(n.startTime).toLocaleString()}</span>
                      <span>Audience: {n.audienceType}</span>
                      <span>Channels: {(n.channels ?? []).join(", ")}</span>
                      {n.createdBy && <span>By: {n.createdBy.name ?? n.createdBy.email}</span>}
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}

          {data.pages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="flex items-center gap-1 text-sm text-[#167C80] disabled:text-[#56707B]/30">
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <span className="text-xs text-[#56707B]">Page {data.page} of {data.pages}</span>
              <button onClick={() => setPage((p) => Math.min(data.pages, p + 1))} disabled={page >= data.pages} className="flex items-center gap-1 text-sm text-[#167C80] disabled:text-[#56707B]/30">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
