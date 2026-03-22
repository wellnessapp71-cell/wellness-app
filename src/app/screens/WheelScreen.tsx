import { motion } from "motion/react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { Activity, Brain, Sparkles, Moon, ChevronRight, TrendingUp } from "lucide-react";
import { GlassCard } from "../components/GlassCard";
import { cn } from "../utils";

const data = [
  { subject: "Physical", A: 75, fullMark: 100 },
  { subject: "Lifestyle", A: 90, fullMark: 100 },
  { subject: "Spiritual", A: 85, fullMark: 100 },
  { subject: "Mental", A: 60, fullMark: 100 },
];

const cards = [
  { title: "Physical", score: 75, icon: Activity, color: "text-[#34C759]", bg: "bg-[#34C759]/10", trend: "+5%", msg: "HR trend stable" },
  { title: "Mental", score: 60, icon: Brain, color: "text-[#007AFF]", bg: "bg-[#007AFF]/10", trend: "-2%", msg: "Stress slightly up" },
  { title: "Spiritual", score: 85, icon: Sparkles, color: "text-[#AF52DE]", bg: "bg-[#AF52DE]/10", trend: "+12%", msg: "Streak: 7 days" },
  { title: "Lifestyle", score: 90, icon: Moon, color: "text-[#FF9500]", bg: "bg-[#FF9500]/10", trend: "+1%", msg: "Great sleep avg" },
];

export function WheelScreen() {
  return (
    <div className="flex flex-col gap-8 p-6 pt-12">
      <header className="mb-2">
        <h1 className="text-[34px] leading-tight font-bold text-black tracking-tight mb-1">
          Wellness Wheel
        </h1>
        <p className="text-[17px] text-[#8A8A8E] font-medium tracking-tight">
          Tap a segment to explore deeply
        </p>
      </header>

      {/* The Wheel */}
      <GlassCard className="p-6 relative h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
            <PolarGrid stroke="#E5E5EA" strokeDasharray="3 3" />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: '#8A8A8E', fontSize: 13, fontWeight: 600 }} 
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="Alex"
              dataKey="A"
              stroke="#007AFF"
              strokeWidth={3}
              fill="#007AFF"
              fillOpacity={0.15}
            />
          </RadarChart>
        </ResponsiveContainer>
        
        {/* Center overlay */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[72px] h-[72px] bg-white rounded-full shadow-sm flex items-center justify-center border border-black/[0.04]">
          <span className="text-[22px] font-bold text-black">77</span>
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
              <GlassCard className="p-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.98]">
                <div className="flex justify-between items-start mb-4">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", card.bg)}>
                    <Icon className={cn("w-5 h-5", card.color)} strokeWidth={2.5} />
                  </div>
                  <span className="text-[20px] font-bold text-black">{card.score}</span>
                </div>
                
                <h3 className="font-semibold text-black text-[15px] tracking-tight">{card.title}</h3>
                <div className="flex items-center gap-1.5 mt-1 text-[13px] font-medium text-[#8A8A8E]">
                  <TrendingUp className="w-3.5 h-3.5 text-[#34C759]" />
                  <span className="truncate">{card.msg}</span>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      <GlassCard className="p-4 mt-2 bg-black flex justify-between items-center active:scale-[0.98] transition-transform cursor-pointer">
        <div>
          <h3 className="font-semibold text-white tracking-tight text-[17px]">Custom Plan</h3>
          <p className="text-[#8A8A8E] text-[13px] mt-0.5 font-medium">AI-driven multi-domain targets</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
          <ChevronRight className="w-5 h-5 text-white" />
        </div>
      </GlassCard>
    </div>
  );
}
