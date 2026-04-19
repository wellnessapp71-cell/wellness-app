"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { GlassCard } from "@/components/wellness/glass-card";
import {
  clearStoredAuth,
  getDashboardRoute,
  getStoredAuth,
  setStoredAuth,
  type StoredAuthUser,
} from "@/lib/client-auth";

type Mode = "login" | "signup";
type Role = "admin" | "hr" | "psychologist" | "employee";

interface PortalAuthPageProps {
  mode: Mode;
}

const ROLE_DISPLAY: Record<Role, string> = {
  admin: "Admin",
  hr: "HR",
  psychologist: "Psychologist",
  employee: "Employee",
};

const loginRoles: Role[] = ["admin", "hr", "psychologist", "employee"];
const signupRoles: Role[] = ["hr", "psychologist", "employee"];

export function PortalAuthPage({ mode }: PortalAuthPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<Role>(
    (searchParams.get("role") as Role) || (mode === "signup" ? "hr" : "admin"),
  );
  const [form, setForm] = useState<Record<string, string>>({
    login: "",
    email: "",
    username: "",
    password: "",
    name: "",
    companyName: "",
    companyIndustry: "",
    companySize: "",
    companyWebsite: "",
    workEmail: "",
    jobTitle: "",
    phone: "",
    licenseNumber: "",
    education: "",
    yearsExperience: "",
    specialties: "Stress, Burnout, Anxiety",
    languages: "English, Hindi",
    sessionModes: "text, audio, video",
    bio: "",
    referralCode: "",
    employeeCode: "",
    department: "",
    title: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const existing = getStoredAuth();
    if (existing) {
      router.replace(getDashboardRoute(existing.role));
    }
  }, [router]);

  useEffect(() => {
    const nextRole = searchParams.get("role") as Role | null;
    if (nextRole) {
      setRole(nextRole);
    }
  }, [searchParams]);

  const allowedRoles = mode === "signup" ? signupRoles : loginRoles;
  const title = mode === "signup" ? "Create your portal" : "Welcome back";
  const subtitle =
    mode === "signup"
      ? "Set up your workspace — HR, psychologist, or employee — and start your wellness journey."
      : "Choose your role, sign in securely, and continue from your live dashboard.";

  const fields = useMemo(() => {
    if (mode === "login") {
      return [
        { key: "login", label: "Email or username", type: "text", placeholder: "jane@company.com" },
        { key: "password", label: "Password", type: "password", placeholder: "••••••••" },
      ];
    }

    const base = [
      { key: "name", label: "Full name", type: "text", placeholder: "Jane Sharma" },
      { key: "email", label: "Work email", type: "email", placeholder: "jane@company.com" },
      { key: "username", label: "Username", type: "text", placeholder: "jane_hr" },
      { key: "password", label: "Password", type: "password", placeholder: "StrongPassword1" },
    ];

    if (role === "hr") {
      return [
        ...base,
        { key: "companyName", label: "Company name", type: "text", placeholder: "Northstar Health" },
        { key: "companyIndustry", label: "Industry", type: "text", placeholder: "Healthcare" },
        { key: "companySize", label: "Company size", type: "number", placeholder: "240" },
        { key: "companyWebsite", label: "Company website", type: "url", placeholder: "https://northstar.com" },
        { key: "jobTitle", label: "Your role", type: "text", placeholder: "HR Director" },
        { key: "phone", label: "Phone", type: "tel", placeholder: "+91 98xxxxxxx" },
      ];
    }

    if (role === "employee") {
      return [
        ...base,
        { key: "referralCode", label: "Company referral code", type: "text", placeholder: "NORTH-A2KQ" },
        { key: "employeeCode", label: "Employee code (optional)", type: "text", placeholder: "EMP-1234" },
        { key: "department", label: "Department (optional)", type: "text", placeholder: "Engineering" },
        { key: "title", label: "Job title (optional)", type: "text", placeholder: "Software Engineer" },
      ];
    }

    return [
      ...base,
      { key: "licenseNumber", label: "License number", type: "text", placeholder: "PSY-29817" },
      { key: "education", label: "Education", type: "text", placeholder: "M.Phil Clinical Psychology" },
      { key: "yearsExperience", label: "Years of experience", type: "number", placeholder: "8" },
      { key: "specialties", label: "Specialties", type: "text", placeholder: "Stress, Anxiety, Burnout" },
      { key: "languages", label: "Languages", type: "text", placeholder: "English, Hindi" },
      { key: "sessionModes", label: "Session modes", type: "text", placeholder: "text, audio, video" },
      { key: "bio", label: "Professional bio", type: "textarea", placeholder: "Short background and care style..." },
    ];
  }, [mode, role]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      const payload =
        mode === "login"
          ? {
              login: form.login,
              password: form.password,
              role,
            }
          : buildSignupPayload(role, form);

      const endpoint = mode === "signup" ? "register" : mode;
      const response = await fetch(`/api/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await response.json();
      if (!response.ok) {
        // Parse field-level validation errors from Zod
        const details = body?.error?.details;
        if (Array.isArray(details) && details.length > 0) {
          const mapped: Record<string, string> = {};
          for (const issue of details) {
            const fieldKey = Array.isArray(issue.path) ? issue.path[0] : null;
            if (fieldKey && typeof issue.message === "string") {
              // Only keep the first error per field
              if (!mapped[fieldKey]) {
                mapped[fieldKey] = issue.message;
              }
            }
          }
          if (Object.keys(mapped).length > 0) {
            setFieldErrors(mapped);
            // Still show a top-level summary
            setError("Please fix the highlighted fields below.");
            return;
          }
        }
        throw new Error(body?.error?.message ?? "Unable to continue.");
      }

      const authUser = (body?.data ?? body) as StoredAuthUser;
      setStoredAuth(authUser);
      router.push(getDashboardRoute(authUser.role));
    } catch (submitError) {
      clearStoredAuth();
      setError(submitError instanceof Error ? submitError.message : "Unable to continue.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#EDF7F7_0%,_#F7FAFD_40%,_#EEF1F8_100%)] px-6 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col gap-8 lg:grid lg:grid-cols-[0.92fr_1.08fr]">
        <GlassCard className="border-white/70 bg-[#10242A] p-8 text-white shadow-[0_24px_80px_rgba(16,36,42,0.22)]">
          <Link href="/" className="inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10">
            Back to landing
          </Link>
          <div className="mt-10">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#92D5D7]">
              Aura web portal
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-4 max-w-md text-base leading-8 text-white/72">{subtitle}</p>
          </div>

          <div className="mt-10 space-y-3">
            {allowedRoles.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setRole(item)}
                className={`w-full rounded-[22px] border px-5 py-4 text-left transition ${
                  role === item
                    ? "border-[#92D5D7] bg-[#16353D] shadow-[0_12px_30px_rgba(0,0,0,0.12)]"
                    : "border-white/10 bg-white/5 hover:bg-white/8"
                }`}
              >
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#92D5D7]">{ROLE_DISPLAY[item]}</p>
                <p className="mt-1 text-sm text-white/70">
                  {item === "admin" && "Platform-wide visibility across organizations and employees."}
                  {item === "hr" && "Company insights, webinar broadcast, and employee support tracking."}
                  {item === "psychologist" && "Session triage, acceptance, scheduling, and care delivery."}
                  {item === "employee" && (mode === "login" ? "Your personal wellness dashboard — also available on the Aura mobile app." : "Join your company's wellness program with your referral code.")}
                </p>
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="border-white/80 bg-white/80 p-7 backdrop-blur-xl lg:p-9">
          {mode === "login" && role === "employee" ? (
          <div>
            <div className="mb-6 rounded-[20px] border border-[#BFE3E3] bg-[#EDF7F7] px-5 py-4 text-sm leading-6 text-[#17303A]">
              <p className="font-semibold">Prefer the mobile experience?</p>
              <p className="mt-1 text-[#2F4952]">
                Install the Aura app for on-the-go check-ins, plans, and push reminders. The web portal gives you the same dashboard and tools on a larger screen.
              </p>
            </div>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#167C80]">
                  Secure login
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#10242A]">
                  Sign in as Employee
                </h2>
              </div>

              <div className="grid gap-4">
                {fields.map((field) => {
                  const fieldErr = fieldErrors[field.key];
                  const errBorder = fieldErr ? "border-[#E2564A]" : "border-[#D7E3E7]";
                  return (
                    <label key={field.key} className="flex flex-col gap-2">
                      <span className="text-sm font-semibold text-[#2F4952]">{field.label}</span>
                      <input
                        type={field.type}
                        value={form[field.key] ?? ""}
                        onChange={(event) => {
                          setForm((current) => ({ ...current, [field.key]: event.target.value }));
                          if (fieldErr) setFieldErrors((prev) => { const n = { ...prev }; delete n[field.key]; return n; });
                        }}
                        placeholder={field.placeholder}
                        className={`rounded-[20px] border ${errBorder} bg-[#F8FBFC] px-4 py-3 text-sm text-[#17303A] outline-none transition focus:border-[#167C80] focus:bg-white`}
                      />
                      {fieldErr && <p className="mt-0.5 text-xs font-medium text-[#B42318]">{fieldErr}</p>}
                    </label>
                  );
                })}
              </div>

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
                {submitting ? "Please wait..." : "Continue"}
              </button>

              <div className="flex items-center justify-between">
                <Link href="/signup?role=employee" className="text-sm font-semibold text-[#167C80] transition hover:text-[#10242A]">
                  Create account
                </Link>
                <Link href="/forgot-password" className="text-sm font-semibold text-[#167C80] transition hover:text-[#10242A]">
                  Forgot password?
                </Link>
              </div>
            </form>
          </div>
          ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#167C80]">
                  {mode === "signup" ? "Role onboarding" : "Secure login"}
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#10242A]">
                  {mode === "signup" ? `Setup for ${ROLE_DISPLAY[role]}` : `Sign in as ${ROLE_DISPLAY[role]}`}
                </h2>
              </div>
              <Link
                href={mode === "signup" ? "/login" : "/signup"}
                className="rounded-full border border-[#CAD7DD] px-4 py-2 text-sm font-semibold text-[#17303A] transition hover:bg-[#F7FBFC]"
              >
                {mode === "signup" ? "Have an account?" : "Create account"}
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {fields.map((field) => {
                const fieldErr = fieldErrors[field.key];
                const errBorder = fieldErr ? "border-[#E2564A]" : "border-[#D7E3E7]";
                return (
                  <label
                    key={field.key}
                    className={`flex flex-col gap-2 ${field.type === "textarea" ? "md:col-span-2" : ""}`}
                  >
                    <span className="text-sm font-semibold text-[#2F4952]">{field.label}</span>
                    {field.type === "textarea" ? (
                      <textarea
                        value={form[field.key] ?? ""}
                        onChange={(event) => {
                          setForm((current) => ({ ...current, [field.key]: event.target.value }));
                          if (fieldErr) setFieldErrors((prev) => { const n = { ...prev }; delete n[field.key]; return n; });
                        }}
                        placeholder={field.placeholder}
                        rows={5}
                        className={`rounded-[20px] border ${errBorder} bg-[#F8FBFC] px-4 py-3 text-sm text-[#17303A] outline-none transition focus:border-[#167C80] focus:bg-white`}
                      />
                    ) : (
                      <input
                        type={field.type}
                        value={form[field.key] ?? ""}
                        onChange={(event) => {
                          setForm((current) => ({ ...current, [field.key]: event.target.value }));
                          if (fieldErr) setFieldErrors((prev) => { const n = { ...prev }; delete n[field.key]; return n; });
                        }}
                        placeholder={field.placeholder}
                        className={`rounded-[20px] border ${errBorder} bg-[#F8FBFC] px-4 py-3 text-sm text-[#17303A] outline-none transition focus:border-[#167C80] focus:bg-white`}
                      />
                    )}
                    {fieldErr && (
                      <p className="mt-0.5 text-xs font-medium text-[#B42318]">{fieldErr}</p>
                    )}
                  </label>
                );
              })}
            </div>

            {error ? (
              <div className="rounded-[18px] border border-[#F4C6CD] bg-[#FFF5F7] px-4 py-3 text-sm text-[#B42318]">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-[22px] bg-[#10242A] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#17303A] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Please wait..." : mode === "signup" ? "Create workspace" : "Continue"}
            </button>

            {mode === "login" && (
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm font-semibold text-[#167C80] transition hover:text-[#10242A]"
                >
                  Forgot password?
                </Link>
              </div>
            )}
          </form>
          )}
        </GlassCard>
      </div>
    </main>
  );
}

function buildSignupPayload(role: Role, form: Record<string, string>) {
  const common = {
    role,
    name: form.name,
    email: form.email,
    username: form.username,
    password: form.password,
  };

  if (role === "hr") {
    return {
      ...common,
      companyName: form.companyName,
      companyIndustry: form.companyIndustry,
      companySize: Number(form.companySize || 0),
      companyWebsite: form.companyWebsite,
      workEmail: form.email,
      jobTitle: form.jobTitle,
      phone: form.phone,
    };
  }

  if (role === "psychologist") {
    return {
      ...common,
      licenseNumber: form.licenseNumber,
      education: form.education,
      yearsExperience: Number(form.yearsExperience || 0),
      specialties: splitCsv(form.specialties),
      languages: splitCsv(form.languages),
      sessionModes: splitCsv(form.sessionModes).map((mode) => mode.toLowerCase()),
      bio: form.bio,
    };
  }

  if (role === "employee") {
    return {
      ...common,
      referralCode: form.referralCode,
      employeeCode: form.employeeCode || undefined,
      department: form.department || undefined,
      title: form.title || undefined,
    };
  }

  return common;
}

function splitCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
