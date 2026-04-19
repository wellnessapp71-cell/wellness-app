"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, BrainCircuit, Leaf, Sparkles, ArrowRight, Flame, Dumbbell, Calendar } from "lucide-react";
import { PageHeader } from "@/components/portal-nav-shell";
import { GlassCard } from "@/components/wellness/glass-card";
import { fetchWithAuth, getStoredAuth } from "@/lib/client-auth";

interface ProfileResponse {
  user: { id: string; name: string | null; email: string };
  profile: {
    scorePhysical: number;
    scoreMental: number;
    scoreSpiritual: number;
    scoreLifestyle: number;
    mentalOnboardingDone?: boolean;
    physicalOnboardingDone?: boolean;
    spiritualOnboardingDone?: boolean;
    lifestyleOnboardingDone?: boolean;
    streakDays?: number;
    totalWorkouts?: number;
    totalCaloriesBurned?: number;
  } | null;
}

const PILLARS = [
  { key: "scorePhysical", label: "Physical", color: "#FF2D55", Icon: Activity, hub: "/app/physical", onboard: "/app/physical/onboarding", flag: "physicalOnboardingDone" as const },
  { key: "scoreMental", label: "Mental", color: "#5AC8FA", Icon: BrainCircuit, hub: "/app/mental", onboard: "/app/mental/onboarding", flag: "mentalOnboardingDone" as const },
  { key: "scoreSpiritual", label: "Inner Calm", color: "#5E5CE6", Icon: Sparkles, hub: "/app/spiritual", onboard: "/app/spiritual/onboarding", flag: "spiritualOnboardingDone" as const },
  { key: "scoreLifestyle", label: "Lifestyle", color: "#34C759", Icon: Leaf, hub: "/app/lifestyle", onboard: "/app/lifestyle/onboarding", flag: "lifestyleOnboardingDone" as const },
] as const;

export default function EmployeeDashboard() {
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [greeting, setGreeting] = useState("Welcome");

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening");
    const auth = getStoredAuth();
    if (!auth) return;

    (async () => {
      try {
        const result = await fetchWithAuth<ProfileResponse>("/api/profile");
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load your workspace.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const profile = data?.profile ?? null;
  const firstName = data?.user.name?.split(" ")[0] ?? null;

  return (
    <div>
      <PageHeader
        title={`${greeting}${firstName ? `, ${firstName}` : ""}`}
        subtitle="Your wellness snapshot across the four pillars."
        actions={
          <Link
            href="/app/checkins"
            className="inline-flex items-center gap-2 rounded-full bg-[#10242A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#17303A]"
          >
            Log a check-in
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      {error && (
        <div className="mb-6 rounded-[20px] border border-[#F4C6CD] bg-[#FFF5F7] px-5 py-4 text-sm text-[#B42318]">
          {error}
        </div>
      )}

      {loading ? (
        <SkeletonGrid />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <GlassCard className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#10242A]">Wellness pillars</h2>
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#56707B]">
                Last updated just now
              </span>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {PILLARS.map(({ key, label, color, Icon, hub, onboard, flag }) => {
                const score = (profile?.[key as keyof typeof profile] as number | undefined) ?? 0;
                const started = profile ? Boolean(profile[flag]) : false;
                return (
                  <Link
                    key={key}
                    href={started ? hub : onboard}
                    className="group rounded-[20px] border border-[#E8EEF0] bg-white p-5 transition hover:border-[#BFE3E3] hover:shadow-[0_10px_30px_rgba(16,36,42,0.08)]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl"
                          style={{ background: `${color}15` }}
                        >
                          <Icon className="h-5 w-5" style={{ color }} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#10242A]">{label}</p>
                          <p className="text-xs text-[#56707B]">
                            {started ? "Continue your plan" : "Complete baseline"}
                          </p>
                        </div>
                      </div>
                      <span className="text-2xl font-semibold tracking-tight text-[#10242A]">
                        {score}
                        <span className="ml-0.5 text-xs font-semibold text-[#56707B]">/100</span>
                      </span>
                    </div>
                    <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#F0F3F5]">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.max(0, Math.min(100, score))}%`, background: color }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-base font-semibold text-[#10242A]">Your stats</h2>
            <div className="mt-5 space-y-5">
              <StatRow
                Icon={Flame}
                label="Current streak"
                value={`${profile?.streakDays ?? 0} days`}
                color="#FF9500"
              />
              <StatRow
                Icon={Dumbbell}
                label="Workouts logged"
                value={`${profile?.totalWorkouts ?? 0}`}
                color="#FF2D55"
              />
              <StatRow
                Icon={Calendar}
                label="Calories burned"
                value={`${profile?.totalCaloriesBurned ?? 0}`}
                color="#5AC8FA"
              />
            </div>
            <Link
              href="/app/profile"
              className="mt-6 inline-flex w-full items-center justify-center rounded-2xl border border-[#CFDADF] px-4 py-2.5 text-sm font-semibold text-[#17303A] transition hover:bg-[#F7FBFC]"
            >
              Edit profile
            </Link>
          </GlassCard>

          <GlassCard className="lg:col-span-3 p-6">
            <h2 className="text-base font-semibold text-[#10242A]">Quick actions</h2>
            <p className="mt-1 text-sm text-[#56707B]">Jump straight to the tools you use most.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <QuickLink href="/app/checkins/new" label="Daily check-in" desc="Mood + energy + sleep" />
              <QuickLink href="/app/support" label="Get support" desc="Message HR or book a session" />
              <QuickLink href="/app/physical" label="Workouts & nutrition" desc="Plans and logs" />
              <QuickLink href="/app/discover" label="Discover content" desc="Meditations, courses, more" />
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

function StatRow({ Icon, label, value, color }: { Icon: typeof Flame; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: `${color}15` }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div className="flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#56707B]">{label}</p>
        <p className="mt-0.5 text-lg font-semibold text-[#10242A]">{value}</p>
      </div>
    </div>
  );
}

function QuickLink({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <Link
      href={href}
      className="rounded-[20px] border border-[#E8EEF0] bg-white p-5 transition hover:border-[#BFE3E3] hover:shadow-[0_10px_30px_rgba(16,36,42,0.08)]"
    >
      <p className="text-sm font-semibold text-[#10242A]">{label}</p>
      <p className="mt-1 text-xs text-[#56707B]">{desc}</p>
      <ArrowRight className="mt-4 h-4 w-4 text-[#167C80]" />
    </Link>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="h-60 rounded-[28px] bg-white/60 backdrop-blur-xl lg:col-span-2" />
      <div className="h-60 rounded-[28px] bg-white/60 backdrop-blur-xl" />
      <div className="h-40 rounded-[28px] bg-white/60 backdrop-blur-xl lg:col-span-3" />
    </div>
  );
}
