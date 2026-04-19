"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/portal-nav-shell";
import { GlassCard } from "@/components/wellness/glass-card";
import { fetchWithAuth } from "@/lib/client-auth";

const MOODS = ["calm", "happy", "neutral", "anxious", "sad", "angry"] as const;
const ENERGY_LEVELS = ["low", "medium", "high"] as const;

export default function NewCheckinPage() {
  const router = useRouter();
  const [mood, setMood] = useState<(typeof MOODS)[number]>("neutral");
  const [energy, setEnergy] = useState<(typeof ENERGY_LEVELS)[number]>("medium");
  const [sleepHours, setSleepHours] = useState(7);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      await fetchWithAuth("/api/progress/checkin", {
        method: "POST",
        body: JSON.stringify({
          mood,
          energy,
          sleepHours,
          note,
          dateIso: new Date().toISOString(),
        }),
      });
      router.push("/app/checkins");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="New check-in" subtitle="Takes under a minute." />
      {error && (
        <div className="mb-6 rounded-[20px] border border-[#F4C6CD] bg-[#FFF5F7] px-5 py-4 text-sm text-[#B42318]">
          {error}
        </div>
      )}
      <GlassCard className="max-w-2xl p-6">
        <div className="space-y-6">
          <Section label="Mood">
            <Chips values={MOODS} selected={mood} onSelect={setMood} />
          </Section>
          <Section label="Energy">
            <Chips values={ENERGY_LEVELS} selected={energy} onSelect={setEnergy} />
          </Section>
          <Section label={`Sleep hours: ${sleepHours}h`}>
            <input
              type="range"
              min={0}
              max={14}
              step={0.5}
              value={sleepHours}
              onChange={(e) => setSleepHours(Number(e.target.value))}
              className="w-full accent-[#167C80]"
            />
          </Section>
          <Section label="Notes (optional)">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-[#CFDADF] bg-white px-4 py-2.5 text-sm text-[#10242A] outline-none transition focus:border-[#167C80]"
              placeholder="Anything on your mind…"
            />
          </Section>
        </div>
        <button
          onClick={submit}
          disabled={saving}
          className="mt-6 inline-flex items-center rounded-full bg-[#10242A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#17303A] disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save check-in"}
        </button>
      </GlassCard>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#56707B]">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Chips<T extends string>({
  values,
  selected,
  onSelect,
}: {
  values: readonly T[];
  selected: T;
  onSelect: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onSelect(v)}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
            selected === v
              ? "border-[#10242A] bg-[#10242A] text-white"
              : "border-[#CFDADF] bg-white text-[#2F4952] hover:border-[#167C80]"
          }`}
        >
          {v.charAt(0).toUpperCase() + v.slice(1)}
        </button>
      ))}
    </div>
  );
}
