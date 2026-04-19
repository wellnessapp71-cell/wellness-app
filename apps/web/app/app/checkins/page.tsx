"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Calendar } from "lucide-react";
import { PageHeader } from "@/components/portal-nav-shell";
import { GlassCard } from "@/components/wellness/glass-card";
import { fetchWithAuth } from "@/lib/client-auth";

interface CheckinEntry {
  mood?: string;
  energy?: string;
  sleepHours?: number;
  note?: string;
  dateIso?: string;
}

export default function CheckinsPage() {
  const [entries, setEntries] = useState<CheckinEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const rows = await fetchWithAuth<CheckinEntry[]>("/api/progress/checkin?limit=30");
        setEntries(Array.isArray(rows) ? rows : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load check-ins.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      <PageHeader
        title="Daily check-ins"
        subtitle="Track how you feel, sleep, and recover day-to-day."
        actions={
          <Link
            href="/app/checkins/new"
            className="inline-flex items-center gap-2 rounded-full bg-[#10242A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#17303A]"
          >
            New check-in
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />
      {error && (
        <div className="mb-6 rounded-[20px] border border-[#F4C6CD] bg-[#FFF5F7] px-5 py-4 text-sm text-[#B42318]">
          {error}
        </div>
      )}
      <GlassCard className="p-6">
        <h2 className="text-base font-semibold text-[#10242A]">Recent entries</h2>
        {loading ? (
          <div className="mt-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-[#F0F3F5]" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="mt-6 text-sm text-[#56707B]">
            No check-ins yet. Log your first one to start building your streak.
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {entries.map((e, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-2xl border border-[#E8EEF0] bg-white px-4 py-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF6F7]">
                  <Calendar className="h-5 w-5 text-[#167C80]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#10242A]">
                    {e.dateIso ? new Date(e.dateIso).toLocaleDateString() : "Recent"}
                  </p>
                  <p className="mt-0.5 text-xs text-[#56707B]">
                    Mood {e.mood ?? "—"} · Energy {e.energy ?? "—"} · Sleep {e.sleepHours ?? "—"}h
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
