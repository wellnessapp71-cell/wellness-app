"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearStoredAuth, getDashboardRoute, getStoredAuth, type StoredAuthUser } from "@/lib/client-auth";

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface PortalNavShellProps {
  role: "admin" | "hr" | "employee" | "psychologist";
  roleLabel: string;
  navItems: NavItem[];
  children: React.ReactNode;
}

export function PortalNavShell({ role, roleLabel, navItems, children }: PortalNavShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [auth, setAuth] = useState<StoredAuthUser | null>(null);

  useEffect(() => {
    const stored = getStoredAuth();
    if (!stored) {
      router.replace(`/login?role=${role}`);
      return;
    }
    if (stored.role !== role) {
      router.replace(getDashboardRoute(stored.role));
      return;
    }
    setAuth(stored);
  }, [router, role]);

  if (!auth) return null;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#EDF7F7_0%,_#F5F8FC_45%,_#EEF2F8_100%)]">
      <div className="mx-auto flex min-h-screen max-w-[1440px] gap-6 px-6 py-6">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-6 rounded-[28px] border border-white/80 bg-white/80 p-4 shadow-[0_20px_60px_rgba(15,35,56,0.08)] backdrop-blur-xl">
            <div className="px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#167C80]">{roleLabel}</p>
              <p className="mt-1 text-sm font-semibold text-[#10242A]">{auth.name ?? auth.email}</p>
            </div>
            <nav className="mt-2 flex flex-col gap-1">
              {navItems.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-[#10242A] text-white shadow-[0_8px_20px_rgba(16,36,42,0.18)]"
                        : "text-[#2F4952] hover:bg-[#F4F8F9]"
                    }`}
                  >
                    {Icon ? <Icon className="h-4 w-4" /> : null}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <button
              onClick={() => {
                clearStoredAuth();
                router.push("/");
              }}
              className="mt-4 w-full rounded-2xl border border-[#CFDADF] px-3 py-2 text-sm font-semibold text-[#17303A] transition hover:bg-white"
            >
              Logout
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </main>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-4 rounded-[28px] border border-white/80 bg-white/80 px-6 py-5 shadow-[0_20px_60px_rgba(15,35,56,0.08)] backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#10242A]">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-[#56707B]">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </header>
  );
}

export function PlaceholderCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[28px] border border-dashed border-[#CFDADF] bg-white/60 p-10 text-center backdrop-blur-xl">
      <div className="mx-auto max-w-md">
        <div className="inline-flex items-center justify-center rounded-full bg-[#EEF6F7] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#167C80]">
          Coming soon
        </div>
        <h2 className="mt-4 text-xl font-semibold text-[#10242A]">{title}</h2>
        <p className="mt-2 text-sm text-[#56707B]">{description}</p>
      </div>
    </div>
  );
}
