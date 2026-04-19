"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GlassCard } from "@/components/wellness/glass-card";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message ?? "Unable to reset password.");
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reset password.");
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
            Choose a new password
          </h1>

          {!token ? (
            <p className="mt-4 rounded-[20px] border border-[#F4C6CD] bg-[#FFF5F7] px-4 py-3 text-sm text-[#B42318]">
              Missing reset token. Please use the link from the email we sent you.
            </p>
          ) : done ? (
            <div className="mt-8 rounded-[20px] border border-[#BFE3E3] bg-[#EDF7F7] px-5 py-4 text-sm text-[#17303A]">
              Your password has been reset. Redirecting to sign in…
            </div>
          ) : (
            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-[#2F4952]">New password</span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-[20px] border border-[#D7E3E7] bg-[#F8FBFC] px-4 py-3 text-sm text-[#17303A] outline-none transition focus:border-[#167C80] focus:bg-white"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-[#2F4952]">Confirm password</span>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
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
                {submitting ? "Resetting..." : "Reset password"}
              </button>
            </form>
          )}
        </GlassCard>
      </div>
    </main>
  );
}
