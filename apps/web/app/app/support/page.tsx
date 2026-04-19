"use client";

import { useEffect, useState } from "react";
import { LifeBuoy } from "lucide-react";
import { PageHeader } from "@/components/portal-nav-shell";
import { GlassCard } from "@/components/wellness/glass-card";
import { fetchWithAuth } from "@/lib/client-auth";

interface HelpRequest {
  id: string;
  category: string;
  priority: string;
  subject: string | null;
  message: string;
  status: string;
  createdAt: string;
}

const CATEGORIES = [
  { value: "mental_health", label: "Mental health" },
  { value: "physical_health", label: "Physical health" },
  { value: "workplace", label: "Workplace" },
  { value: "personal", label: "Personal" },
  { value: "technical", label: "Technical" },
  { value: "other", label: "Other" },
] as const;

const PRIORITIES = ["low", "normal", "high", "urgent"] as const;

export default function SupportPage() {
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["value"]>("mental_health");
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>("normal");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function load() {
    try {
      const result = await fetchWithAuth<{ requests: HelpRequest[] }>("/api/help-requests");
      setRequests(result.requests ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load requests.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submit() {
    if (message.trim().length < 5) {
      setError("Message is too short.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await fetchWithAuth("/api/help-requests", {
        method: "POST",
        body: JSON.stringify({
          category,
          priority,
          subject: subject || undefined,
          message,
        }),
      });
      setSuccess("Request submitted. Your HR team will respond shortly.");
      setSubject("");
      setMessage("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Support"
        subtitle="Message HR, request a session, or report an issue."
      />
      {error && (
        <div className="mb-6 rounded-[20px] border border-[#F4C6CD] bg-[#FFF5F7] px-5 py-4 text-sm text-[#B42318]">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 rounded-[20px] border border-[#BCE3CF] bg-[#ECFDF3] px-5 py-4 text-sm text-[#027A48]">
          {success}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <GlassCard className="lg:col-span-3 p-6">
          <h2 className="text-base font-semibold text-[#10242A]">New request</h2>
          <div className="mt-5 space-y-4">
            <Field label="Category">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as typeof category)}
                className="w-full rounded-2xl border border-[#CFDADF] bg-white px-4 py-2.5 text-sm text-[#10242A] outline-none focus:border-[#167C80]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Priority">
              <div className="flex flex-wrap gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                      priority === p
                        ? "border-[#10242A] bg-[#10242A] text-white"
                        : "border-[#CFDADF] bg-white text-[#2F4952]"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Subject (optional)">
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-2xl border border-[#CFDADF] bg-white px-4 py-2.5 text-sm text-[#10242A] outline-none focus:border-[#167C80]"
                placeholder="Short summary"
              />
            </Field>
            <Field label="Message">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="w-full rounded-2xl border border-[#CFDADF] bg-white px-4 py-2.5 text-sm text-[#10242A] outline-none focus:border-[#167C80]"
                placeholder="Describe what you need help with…"
              />
            </Field>
          </div>
          <button
            onClick={submit}
            disabled={saving}
            className="mt-6 inline-flex items-center rounded-full bg-[#10242A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#17303A] disabled:opacity-60"
          >
            {saving ? "Submitting…" : "Submit request"}
          </button>
        </GlassCard>

        <GlassCard className="lg:col-span-2 p-6">
          <h2 className="text-base font-semibold text-[#10242A]">Recent requests</h2>
          <div className="mt-5 space-y-3">
            {requests.length === 0 ? (
              <p className="text-sm text-[#56707B]">You haven&apos;t submitted any yet.</p>
            ) : (
              requests.map((r) => (
                <div key={r.id} className="rounded-2xl border border-[#E8EEF0] bg-white p-4">
                  <div className="flex items-center gap-2">
                    <LifeBuoy className="h-4 w-4 text-[#167C80]" />
                    <p className="text-sm font-semibold text-[#10242A]">
                      {r.subject ?? r.category.replace("_", " ")}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-[#56707B]">
                    {r.priority} · {r.status} · {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
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
