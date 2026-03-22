"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Sparkles, Brain, Activity, Moon, Sun, Droplets, Camera, ChevronRight } from "lucide-react";
import { GlassCard } from "@/components/wellness/glass-card";

const tasks = [
  { id: 1, title: "Morning Grounding", duration: "5 min", type: "Spiritual", icon: Sparkles, color: "text-[#AF52DE]", bg: "bg-[#AF52DE]/10", done: true },
  { id: 2, title: "Deep Work Flow", duration: "90 min", type: "Mental", icon: Brain, color: "text-[#007AFF]", bg: "bg-[#007AFF]/10", done: false },
  { id: 3, title: "Desk Yoga Routine", duration: "10 min", type: "Physical", icon: Activity, color: "text-[#34C759]", bg: "bg-[#34C759]/10", done: false },
  { id: 4, title: "Sleep Wind-down", duration: "15 min", type: "Lifestyle", icon: Moon, color: "text-[#FF9500]", bg: "bg-[#FF9500]/10", done: false },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8 p-6 pt-12">
      <header className="flex justify-between items-end">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-[34px] leading-tight font-bold text-black tracking-tight mb-1">
            Summary
          </h1>
          <p className="text-[17px] text-[#8A8A8E] font-medium tracking-tight">
            Good morning, Alex
          </p>
        </motion.div>

        <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" alt="Profile" className="w-full h-full object-cover" />
        </div>
      </header>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="p-4 flex flex-col items-start justify-between min-h-[120px] cursor-pointer hover:shadow-md transition-all active:scale-[0.98]">
          <div className="w-8 h-8 rounded-full bg-[#FF2D55]/10 flex items-center justify-center text-[#FF2D55] mb-4">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-black text-[15px] tracking-tight">Stress Scan</h3>
            <p className="text-[13px] text-[#8A8A8E]">Camera based</p>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex flex-col items-start justify-between min-h-[120px] cursor-pointer hover:shadow-md transition-all active:scale-[0.98]">
          <div className="w-8 h-8 rounded-full bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF] mb-4">
            <Droplets className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-black text-[15px] tracking-tight">Log Water</h3>
            <p className="text-[13px] text-[#8A8A8E]">2 of 8 glasses</p>
          </div>
        </GlassCard>
      </div>

      {/* Daily Plan */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[22px] font-bold text-black tracking-tight">Today&apos;s Plan</h2>
          <button className="text-[#007AFF] text-[15px] font-medium active:opacity-70">
            Edit
          </button>
        </div>

        <GlassCard className="flex flex-col overflow-hidden">
          {tasks.map((task, index) => {
            const Icon = task.icon;
            return (
              <div key={task.id} className={cn("px-4 py-3 flex items-center gap-4 bg-white", index !== tasks.length - 1 && "border-b border-[#3C3C43]/[0.05]")}>
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", task.bg)}>
                  <Icon className={cn("w-5 h-5", task.color)} strokeWidth={2.5} />
                </div>

                <div className="flex-1">
                  <h4 className={cn("text-[17px] font-semibold tracking-tight", task.done ? "text-[#8A8A8E] line-through decoration-[#8A8A8E]/50" : "text-black")}>
                    {task.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[13px] text-[#8A8A8E] mt-0.5 font-medium">
                    <span>{task.duration}</span>
                    <span className="w-1 h-1 rounded-full bg-[#C6C6C8]" />
                    <span>{task.type}</span>
                  </div>
                </div>

                <div className={cn(
                  "w-6 h-6 rounded-full border-[1.5px] flex items-center justify-center shrink-0 transition-colors",
                  task.done ? "bg-[#FF2D55] border-[#FF2D55]" : "border-[#C6C6C8]"
                )}>
                  {task.done && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
              </div>
            );
          })}
        </GlassCard>
      </section>

      {/* Highlights */}
      <section>
        <h2 className="text-[22px] font-bold text-black tracking-tight mb-3">Highlights</h2>
        <GlassCard className="p-4 flex items-center justify-between cursor-pointer hover:shadow-md transition-all active:scale-[0.98]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#FF9500]/10 flex items-center justify-center text-[#FF9500]">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-[17px] text-black tracking-tight">Biological Age</h3>
              <p className="text-[13px] text-[#8A8A8E] mt-0.5">Currently 2 yrs younger</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[20px] font-bold text-black">28</span>
            <ChevronRight className="w-5 h-5 text-[#C6C6C8]" />
          </div>
        </GlassCard>
      </section>
    </div>
  );
}
