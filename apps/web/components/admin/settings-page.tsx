"use client";

import { useState } from "react";
import { Boxes, Save } from "lucide-react";
import { GlassCard } from "@/components/wellness/glass-card";
import { PageHeader } from "@/components/portal-nav-shell";

interface SettingGroup {
  label: string;
  description: string;
  settings: Array<{ key: string; label: string; type: "toggle" | "text" | "number"; default: string | boolean }>;
}

const SETTING_GROUPS: SettingGroup[] = [
  {
    label: "Authentication",
    description: "Session and access control settings.",
    settings: [
      { key: "auth.sessionTimeoutMinutes", label: "Session timeout (minutes)", type: "number", default: "1440" },
      { key: "auth.requireMfa", label: "Require MFA for admin/HR", type: "toggle", default: false },
      { key: "auth.passwordMinLength", label: "Minimum password length", type: "number", default: "8" },
    ],
  },
  {
    label: "Notifications",
    description: "Default notification behavior.",
    settings: [
      { key: "notifications.quietHoursStart", label: "Quiet hours start (HH:mm)", type: "text", default: "22:00" },
      { key: "notifications.quietHoursEnd", label: "Quiet hours end (HH:mm)", type: "text", default: "07:00" },
      { key: "notifications.emergencyBypassQuietHours", label: "Emergency bypasses quiet hours", type: "toggle", default: true },
    ],
  },
  {
    label: "Data & Privacy",
    description: "Default data handling behavior.",
    settings: [
      { key: "privacy.defaultRetentionDays", label: "Default retention (days)", type: "number", default: "365" },
      { key: "privacy.anonymizeOnDeletion", label: "Anonymize instead of hard-delete", type: "toggle", default: true },
      { key: "privacy.auditLogRetentionDays", label: "Audit log retention (days)", type: "number", default: "730" },
    ],
  },
  {
    label: "Platform",
    description: "General platform settings.",
    settings: [
      { key: "platform.maintenanceMode", label: "Maintenance mode", type: "toggle", default: false },
      { key: "platform.maxOrganizations", label: "Max organizations", type: "number", default: "1000" },
      { key: "platform.supportEmail", label: "Support email", type: "text", default: "support@aura.health" },
    ],
  },
];

export function SystemSettingsPage() {
  const [values, setValues] = useState<Record<string, string | boolean>>(() => {
    const initial: Record<string, string | boolean> = {};
    for (const group of SETTING_GROUPS) {
      for (const s of group.settings) {
        initial[s.key] = s.default;
      }
    }
    return initial;
  });
  const [saved, setSaved] = useState(false);

  function handleChange(key: string, value: string | boolean) {
    setValues((v) => ({ ...v, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <>
      <PageHeader
        title="System Settings"
        subtitle="Platform-level configuration and operational toggles."
        actions={
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-full bg-[#10242A] px-4 py-2 text-sm font-semibold text-white"
          >
            <Save className="h-4 w-4" />
            {saved ? "Saved!" : "Save settings"}
          </button>
        }
      />

      <div className="space-y-4">
        {SETTING_GROUPS.map((group) => (
          <GlassCard key={group.label} className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Boxes className="h-4 w-4 text-[#167C80]" />
              <h2 className="text-base font-semibold text-[#10242A]">{group.label}</h2>
            </div>
            <p className="mb-4 text-xs text-[#56707B]">{group.description}</p>
            <div className="space-y-4">
              {group.settings.map((s) => (
                <div key={s.key} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-[#17303A]">{s.label}</p>
                    <p className="text-[10px] font-mono text-[#56707B]">{s.key}</p>
                  </div>
                  {s.type === "toggle" ? (
                    <button
                      onClick={() => handleChange(s.key, !values[s.key])}
                      className={`relative h-6 w-11 rounded-full transition ${
                        values[s.key] ? "bg-[#167C80]" : "bg-[#D7E3E7]"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                          values[s.key] ? "left-[22px]" : "left-0.5"
                        }`}
                      />
                    </button>
                  ) : (
                    <input
                      type={s.type === "number" ? "number" : "text"}
                      value={values[s.key] as string}
                      onChange={(e) => handleChange(s.key, e.target.value)}
                      className="w-48 rounded-[12px] border border-[#D7E3E7] bg-white px-3 py-1.5 text-right text-sm outline-none focus:border-[#167C80]"
                    />
                  )}
                </div>
              ))}
            </div>
          </GlassCard>
        ))}
      </div>
    </>
  );
}
