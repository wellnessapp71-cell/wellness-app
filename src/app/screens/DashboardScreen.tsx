import { motion } from "motion/react";
import { cn } from "../utils";
import { Sparkles, Brain, Activity, Moon, Sun, ArrowRight, Droplets, Camera } from "lucide-react";
import { GlassCard } from "../components/GlassCard";

const tasks = [
  { id: 1, title: "Morning Grounding", duration: "5 min", type: "Spiritual", icon: Sparkles, color: "text-purple-500", bg: "bg-purple-100", done: true },
  { id: 2, title: "Deep Work Flow", duration: "90 min", type: "Mental", icon: Brain, color: "text-indigo-500", bg: "bg-indigo-100", done: false },
  { id: 3, title: "Desk Yoga Routine", duration: "10 min", type: "Physical", icon: Activity, color: "text-emerald-500", bg: "bg-emerald-100", done: false },
  { id: 4, title: "Sleep Wind-down", duration: "15 min", type: "Lifestyle", icon: Moon, color: "text-amber-500", bg: "bg-amber-100", done: false },
];

export function DashboardScreen() {
  return (
    <div className="flex flex-col gap-6 p-6 pt-12">
      <header className="flex justify-between items-start">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-semibold text-slate-800 tracking-tight">
            Good morning, <span className="text-indigo-600">Alex</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1 text-[15px]">
            Your readiness score is <span className="text-emerald-500 font-semibold">82%</span> today
          </p>
        </motion.div>
        
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md">
          <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" alt="Profile" className="w-full h-full object-cover" />
        </div>
      </header>

      {/* Quick Actions / Interventions */}
      <div className="grid grid-cols-2 gap-4">
        <GlassCard gradient className="p-4 flex flex-col items-center justify-center text-center gap-2 cursor-pointer hover:shadow-lg transition-all active:scale-95">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-1 shadow-sm">
            <Camera className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-800 text-sm">Stress Scan</h3>
          <p className="text-xs text-slate-500">Camera based</p>
        </GlassCard>
        
        <GlassCard className="p-4 flex flex-col items-center justify-center text-center gap-2 cursor-pointer hover:shadow-lg transition-all active:scale-95">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 mb-1 shadow-sm">
            <Droplets className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-800 text-sm">Log Water</h3>
          <p className="text-xs text-slate-500">2 / 8 glasses</p>
        </GlassCard>
      </div>

      {/* Daily Plan */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-800 tracking-tight">Today's Plan</h2>
          <button className="text-indigo-600 text-sm font-medium hover:underline flex items-center gap-1">
            Edit <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {tasks.map((task, index) => {
            const Icon = task.icon;
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                key={task.id}
              >
                <GlassCard className={cn("p-4 flex items-center gap-4 transition-all", task.done ? "opacity-60" : "hover:scale-[1.02]")}>
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-white/50", task.bg)}>
                    <Icon className={cn("w-6 h-6", task.color)} strokeWidth={2.5} />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className={cn("font-medium", task.done ? "text-slate-500 line-through decoration-slate-300" : "text-slate-800")}>
                      {task.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 font-medium">
                      <span>{task.duration}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span>{task.type}</span>
                    </div>
                  </div>

                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0",
                    task.done ? "bg-emerald-500 border-emerald-500" : "border-slate-300"
                  )}>
                    {task.done && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </section>
      
      {/* Biological Age Teaser */}
      <GlassCard className="p-5 mt-2 bg-gradient-to-r from-slate-900 to-indigo-900 text-white border-none shadow-xl shadow-indigo-500/20">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-300" />
              Biological Age
            </h3>
            <p className="text-slate-300 text-sm mt-1 max-w-[200px]">Your current estimated age is 2 years younger than chronological.</p>
          </div>
          <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
            <span className="text-xl font-bold text-white">28</span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
