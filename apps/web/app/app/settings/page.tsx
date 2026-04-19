"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/portal-nav-shell";
import { GlassCard } from "@/components/wellness/glass-card";
import { clearStoredAuth, fetchWithAuth } from "@/lib/client-auth";

interface ConsentStateValue {
  hrSharing?: boolean;
  research?: boolean;
  dataExport?: boolean;
}

interface ProfilePayload {
  user: { consentState: ConsentStateValue | null };
}

export default function SettingsPage() {
  const router = useRouter();
  const [consent, setConsent] = useState<ConsentStateValue>({});
  const [savingConsent, setSavingConsent] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const result = await fetchWithAuth<ProfilePayload>("/api/profile");
        setConsent(result.user.consentState ?? {});
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load settings.");
      }
    })();
  }, []);

  async function saveConsent(next: ConsentStateValue) {
    setConsent(next);
    setSavingConsent(true);
    try {
      await fetchWithAuth("/api/profile", {
        method: "POST",
        body: JSON.stringify({ consentState: next }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save consent.");
    } finally {
      setSavingConsent(false);
    }
  }

  async function changePassword() {
    if (newPwd.length < 8) {
      setPwdMsg({ kind: "error", text: "New password must be at least 8 characters." });
      return;
    }
    setPwdSaving(true);
    setPwdMsg(null);
    try {
      await fetchWithAuth("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      });
      setPwdMsg({ kind: "ok", text: "Password updated." });
      setCurrentPwd("");
      setNewPwd("");
    } catch (err) {
      setPwdMsg({ kind: "error", text: err instanceof Error ? err.message : "Change failed." });
    } finally {
      setPwdSaving(false);
    }
  }

  async function deleteAccount() {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    try {
      await fetchWithAuth("/api/account/delete", { method: "POST" });
      clearStoredAuth();
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Privacy, security, and account." />
      {error && (
        <div className="mb-6 rounded-[20px] border border-[#F4C6CD] bg-[#FFF5F7] px-5 py-4 text-sm text-[#B42318]">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <GlassCard className="p-6">
          <h2 className="text-base font-semibold text-[#10242A]">Privacy & consent</h2>
          <p className="mt-1 text-sm text-[#56707B]">
            Control how your data is used. Changes are saved automatically.
          </p>
          <div className="mt-5 space-y-3">
            <Toggle
              label="Share aggregated data with HR"
              desc="Your name and message contents stay private."
              checked={!!consent.hrSharing}
              onChange={(v) => saveConsent({ ...consent, hrSharing: v })}
              disabled={savingConsent}
            />
            <Toggle
              label="Contribute to anonymized research"
              desc="Used to improve recommendations for everyone."
              checked={!!consent.research}
              onChange={(v) => saveConsent({ ...consent, research: v })}
              disabled={savingConsent}
            />
            <Toggle
              label="Allow data export requests"
              desc="You can export a copy of your data at any time."
              checked={!!consent.dataExport}
              onChange={(v) => saveConsent({ ...consent, dataExport: v })}
              disabled={savingConsent}
            />
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-base font-semibold text-[#10242A]">Change password</h2>
          {pwdMsg && (
            <div
              className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                pwdMsg.kind === "ok"
                  ? "border-[#BCE3CF] bg-[#ECFDF3] text-[#027A48]"
                  : "border-[#F4C6CD] bg-[#FFF5F7] text-[#B42318]"
              }`}
            >
              {pwdMsg.text}
            </div>
          )}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Current password">
              <input
                type="password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                className="w-full rounded-2xl border border-[#CFDADF] bg-white px-4 py-2.5 text-sm text-[#10242A] outline-none focus:border-[#167C80]"
              />
            </Field>
            <Field label="New password">
              <input
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                className="w-full rounded-2xl border border-[#CFDADF] bg-white px-4 py-2.5 text-sm text-[#10242A] outline-none focus:border-[#167C80]"
              />
            </Field>
          </div>
          <button
            onClick={changePassword}
            disabled={pwdSaving || !currentPwd || !newPwd}
            className="mt-5 inline-flex items-center rounded-full bg-[#10242A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#17303A] disabled:opacity-60"
          >
            {pwdSaving ? "Saving…" : "Update password"}
          </button>
        </GlassCard>

        <GlassCard className="border-[#F4C6CD] p-6">
          <h2 className="text-base font-semibold text-[#B42318]">Danger zone</h2>
          <p className="mt-1 text-sm text-[#56707B]">
            Delete your account. This action cannot be undone.
          </p>
          <div className="mt-4 space-y-3">
            <Field label='Type "DELETE" to confirm'>
              <input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="w-full rounded-2xl border border-[#CFDADF] bg-white px-4 py-2.5 text-sm text-[#10242A] outline-none focus:border-[#B42318]"
              />
            </Field>
            <button
              onClick={deleteAccount}
              disabled={deleteConfirm !== "DELETE" || deleting}
              className="inline-flex items-center rounded-full bg-[#B42318] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#991B14] disabled:opacity-60"
            >
              {deleting ? "Deleting…" : "Delete my account"}
            </button>
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

function Toggle({
  label,
  desc,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-[#E8EEF0] bg-white p-4">
      <div>
        <p className="text-sm font-semibold text-[#10242A]">{label}</p>
        <p className="mt-0.5 text-xs text-[#56707B]">{desc}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-[#167C80]" : "bg-[#CFDADF]"
        } ${disabled ? "opacity-60" : ""}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
