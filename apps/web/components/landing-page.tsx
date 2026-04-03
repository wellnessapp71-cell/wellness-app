"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Building2, HeartPulse, ShieldCheck, UserCog, UsersRound, Video } from "lucide-react";
import { GlassCard } from "@/components/wellness/glass-card";

const featureCards = [
  {
    title: "Employee App",
    text: "Guide employees into check-ins, lessons, support requests, and wellness journeys on mobile.",
    icon: HeartPulse,
    tone: "text-[#167C80] bg-[#167C80]/10",
  },
  {
    title: "HR Intelligence",
    text: "See company-wide wellness patterns, employee insights, and webinar engagement in one place.",
    icon: Building2,
    tone: "text-[#0F6FFF] bg-[#0F6FFF]/10",
  },
  {
    title: "Psychologist Desk",
    text: "Review open requests, accept sessions, and run text, audio, or video support directly from web.",
    icon: Video,
    tone: "text-[#F97316] bg-[#F97316]/10",
  },
];

const roleCards = [
  {
    title: "Admin",
    text: "Manage organizations, platform health, and referral-based onboarding.",
    href: "/login?role=admin",
    icon: ShieldCheck,
  },
  {
    title: "HR",
    text: "Track employee wellbeing trends, push webinar notifications, and monitor company progress.",
    href: "/login?role=hr",
    icon: UsersRound,
  },
  {
    title: "Psychologist",
    text: "Accept support requests, schedule sessions, and manage live care from a single dashboard.",
    href: "/login?role=psychologist",
    icon: UserCog,
  },
];

export function LandingPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(22,124,128,0.18),_transparent_28%),linear-gradient(180deg,_#F5FBFA_0%,_#F7FAFC_35%,_#ECF4F8_100%)] text-[#10242A]">
      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-10">
        <header className="flex flex-col gap-4 rounded-[32px] border border-white/70 bg-white/70 px-6 py-5 backdrop-blur-xl shadow-[0_20px_80px_rgba(10,37,64,0.08)] lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#167C80] text-white shadow-lg shadow-[#167C80]/25">
              <HeartPulse className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#167C80]">Aura Care OS</p>
              <h1 className="text-xl font-semibold tracking-tight text-[#10242A]">Corporate wellness, clinically connected</h1>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-3">
            <Link href="/login?role=admin" className="rounded-full border border-[#C8D9DE] px-4 py-2 text-sm font-semibold text-[#17303A] transition hover:bg-white">
              Admin Login
            </Link>
            <Link href="/login" className="rounded-full border border-[#C8D9DE] px-4 py-2 text-sm font-semibold text-[#17303A] transition hover:bg-white">
              Login
            </Link>
            <Link href="/signup" className="rounded-full bg-[#10242A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#17303A]">
              Signup
            </Link>
          </nav>
        </header>

        <section className="grid gap-8 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:py-14">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="rounded-[40px] border border-white/80 bg-white/75 p-8 shadow-[0_28px_90px_rgba(15,35,56,0.10)] backdrop-blur-xl lg:p-10"
          >
            <div className="mb-6 inline-flex items-center rounded-full bg-[#167C80]/10 px-4 py-1.5 text-sm font-semibold text-[#167C80]">
              Mobile-first employee care. Web-first operations.
            </div>
            <h2 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-[#10242A] lg:text-6xl">
              A modern healthcare-style platform for employee wellbeing, HR insight, and psychologist coordination.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[#4D6570] lg:text-lg">
              Launch your workforce wellness program with one employee app, one operations portal, and one shared live data layer.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="https://play.google.com/store"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#18A957] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#18A957]/25 transition hover:bg-[#14924b]"
              >
                Download App Now
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/signup?role=hr"
                className="inline-flex items-center gap-2 rounded-full border border-[#BFD1D7] bg-white px-6 py-3 text-sm font-semibold text-[#17303A] transition hover:bg-[#F9FCFD]"
              >
                Start HR Workspace
              </Link>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {featureCards.map((card) => {
                const Icon = card.icon;
                return (
                  <GlassCard key={card.title} className="border-white/80 bg-white/85 p-5">
                    <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${card.tone}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold tracking-tight text-[#10242A]">{card.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#5B727D]">{card.text}</p>
                  </GlassCard>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.08 }}
            className="flex flex-col gap-5"
          >
            <GlassCard className="overflow-hidden border-white/80 bg-[#10242A] p-7 text-white shadow-[0_24px_80px_rgba(16,36,42,0.26)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#92D5D7]">Live role portals</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight">Choose your workspace</h3>
              <div className="mt-6 space-y-3">
                {roleCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <Link
                      key={card.title}
                      href={card.href}
                      className="flex items-center justify-between rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 transition hover:bg-white/10"
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                          <Icon className="h-5 w-5 text-[#92D5D7]" />
                        </div>
                        <div>
                          <p className="text-base font-semibold">{card.title}</p>
                          <p className="mt-1 text-sm leading-6 text-white/70">{card.text}</p>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-white/70" />
                    </Link>
                  );
                })}
              </div>
            </GlassCard>

            <GlassCard className="border-white/80 bg-white/85 p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#167C80]">What changes now</p>
              <ul className="mt-4 space-y-4 text-sm leading-6 text-[#4F6772]">
                <li>Employees use the mobile app for assessments, check-ins, lessons, and support requests.</li>
                <li>HR gets organization analytics, webinar broadcasts, and employee-level insight from shared records.</li>
                <li>Psychologists receive open sessions in real time, accept them, schedule them, and continue care from web.</li>
              </ul>
            </GlassCard>
          </motion.div>
        </section>
      </div>
    </main>
  );
}
