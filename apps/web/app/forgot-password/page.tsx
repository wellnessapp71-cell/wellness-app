"use client";

import { useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/wellness/glass-card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message ?? "Unable to send reset link.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send reset link.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#EDF7F7_0%,_#F7FAFD_40%,_#EEF1F8_100%)] px-6 py-16">
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <Link
          href="/login"
          className="inline-flex w-fit rounded-full border border-[#CAD7DD] px-4 py-2 text-sm font-semibold text-[#17303A] transition hover:bg-white"
        >
          ← Back to sign in
        </Link>

        <GlassCard className="border-white/80 bg-white/85 p-8 backdrop-blur-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#167C80]">
            Password recovery
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#10242A]">
            Reset your password
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#607883]">
            Enter the email associated with your Aura account and we&apos;ll send you a secure link to choose a new password.
          </p>

          {done ? (
            <div className="mt-8 rounded-[20px] border border-[#BFE3E3] bg-[#EDF7F7] px-5 py-4 text-sm text-[#17303A]">
              If an account exists for <strong>{email}</strong>, a reset link is on its way. The link expires in 30 minutes.
            </div>
          ) : (
            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-[#2F4952]">Email address</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@company.com"
                  className="rounded-[20px] border border-[#D7E3E7] bg-[#F8FBFC] px-4 py-3 text-sm text-[#17303A] outline-none transition focus:border-[#167C80] focus:bg-white"
                />
              </label>

              {error && (
                <div className="rounded-[18px] border border-[#F4C6CD] bg-[#FFF5F7] px-4 py-3 text-sm text-[#B42318]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-[22px] bg-[#10242A] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#17303A] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Sending..." : "Send reset link"}
              </button>
            </form>
          )}
        </GlassCard>
      </div>
    </main>
  );
}
