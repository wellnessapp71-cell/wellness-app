"use client";

import { useRouter } from "next/navigation";
import { clearStoredAuth, type StoredAuthUser } from "@/lib/client-auth";

interface PortalShellProps {
  title: string;
  subtitle: string;
  auth: StoredAuthUser;
  children: React.ReactNode;
}

export function PortalShell({ title, subtitle, auth, children }: PortalShellProps) {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#EDF7F7_0%,_#F5F8FC_45%,_#EEF2F8_100%)] px-6 py-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 rounded-[32px] border border-white/80 bg-white/80 px-6 py-5 shadow-[0_20px_60px_rgba(15,35,56,0.08)] backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#167C80]">{auth.role} workspace</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#10242A]">{title}</h1>
            <p className="mt-2 text-sm text-[#56707B]">{subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full bg-[#F4F8F9] px-4 py-2 text-sm font-semibold text-[#17303A]">
              {auth.name ?? auth.email}
            </div>
            <button
              onClick={() => {
                clearStoredAuth();
                router.push("/");
              }}
              className="rounded-full border border-[#CFDADF] px-4 py-2 text-sm font-semibold text-[#17303A] transition hover:bg-white"
            >
              Logout
            </button>
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}
