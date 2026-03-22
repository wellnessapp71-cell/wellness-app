import { motion } from "motion/react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { Activity, Brain, Sparkles, Moon, ArrowRight, TrendingUp } from "lucide-react";
import { GlassCard } from "../components/GlassCard";
import { cn } from "../utils";

const data = [
  { subject: "Physical", A: 75, fullMark: 100 },
  { subject: "Lifestyle", A: 90, fullMark: 100 },
  { subject: "Spiritual", A: 85, fullMark: 100 },
  { subject: "Mental", A: 60, fullMark: 100 },
];

const cards = [
  { title: "Physical", score: 75, icon: Activity, color: "text-emerald-500", bg: "bg-emerald-100", trend: "+5%", msg: "HR trend stable" },
  { title: "Mental", score: 60, icon: Brain, color: "text-indigo-500", bg: "bg-indigo-100", trend: "-2%", msg: "Stress slightly up" },
  { title: "Spiritual", score: 85, icon: Sparkles, color: "text-purple-500", bg: "bg-purple-100", trend: "+12%", msg: "Streak: 7 days" },
  { title: "Lifestyle", score: 90, icon: Moon, color: "text-amber-500", bg: "bg-amber-100", trend: "+1%", msg: "Great sleep avg" },
];

export function WheelScreen() {
  return (
    <div className="flex flex-col gap-6 p-6 pt-12">
      <header className="mb-2">
        <h1 className="text-3xl font-semibold text-slate-800 tracking-tight">
          Wellness Wheel
        </h1>
        <p className="text-slate-500 font-medium mt-1 text-[15px]">
          Tap a segment to explore deeply
        </p>
      </header>

      {/* The Wheel */}
      <GlassCard className="p-6 relative h-[320px] shadow-xl shadow-indigo-500/10 border-white/60 bg-white/40">
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-50/50 via-transparent to-emerald-50/50 rounded-3xl -z-10" />
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="#cbd5e1" strokeDasharray="3 3" />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: '#475569', fontSize: 13, fontWeight: 600 }} 
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="Alex"
              dataKey="A"
              stroke="#6366f1"
              strokeWidth={3}
              fill="#818cf8"
              fillOpacity={0.4}
            />
          </RadarChart>
        </ResponsiveContainer>
        
        {/* Center overlay */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-lg border-4 border-indigo-100 flex items-center justify-center">
          <span className="text-xl font-bold text-indigo-600">77</span>
        </div>
      </GlassCard>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              key={card.title}
            >
              <GlassCard className="p-4 hover:shadow-lg transition-all cursor-pointer group active:scale-95">
                <div className="flex justify-between items-start mb-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm", card.bg)}>
                    <Icon className={cn("w-5 h-5", card.color)} strokeWidth={2.5} />
                  </div>
                  <span className="text-lg font-bold text-slate-800">{card.score}</span>
                </div>
                
                <h3 className="font-semibold text-slate-800 text-sm mb-1">{card.title}</h3>
                
                <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 group-hover:text-indigo-600 transition-colors">
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                  <span className="truncate">{card.msg}</span>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      <GlassCard className="p-5 mt-2 bg-slate-900 text-white flex justify-between items-center shadow-2xl shadow-slate-900/20 active:scale-[0.98] transition-all cursor-pointer">
        <div>
          <h3 className="font-semibold text-white">Generate Custom Plan</h3>
          <p className="text-slate-400 text-xs mt-1">AI-driven multi-domain targets</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
          <ArrowRight className="w-5 h-5 text-white" />
        </div>
      </GlassCard>
    </div>
  );
}
