import { motion } from "motion/react";
import { ArrowLeft, Users, Send, TrendingUp, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router";
import { GlassCard } from "../components/GlassCard";

export function AdminScreen() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#F2F2F7] overflow-y-auto pb-12 sm:rounded-[40px] sm:h-[90vh] sm:border-[10px] sm:border-[#1C1C1E] sm:my-[5vh] sm:shadow-2xl">
      <header className="p-6 pt-12 pb-4 bg-[#F2F2F7]/90 backdrop-blur-xl sticky top-0 z-10 border-b border-black/[0.05]">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center text-[#007AFF] active:opacity-70 transition-opacity">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-[22px] font-bold text-black tracking-tight">HR Admin Portal</h1>
        </div>
        
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-[#E5E5EA] text-black rounded-md text-[11px] font-bold uppercase tracking-wider">ACME Corp</span>
          <span className="px-3 py-1 bg-[#34C759]/10 text-[#34C759] rounded-md text-[11px] font-bold uppercase tracking-wider">102 Active Users</span>
        </div>
      </header>

      <main className="p-6 space-y-8">
        {/* Engagement Stats */}
        <section>
          <h2 className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-2 ml-1">Platform Health</h2>
          <div className="grid grid-cols-2 gap-4">
            <GlassCard className="p-4">
              <div className="text-[28px] font-bold text-black mb-1 tracking-tight flex items-center gap-2">
                74% <TrendingUp className="w-5 h-5 text-[#34C759]" />
              </div>
              <div className="text-[13px] text-[#8A8A8E] font-medium">Avg Wheel Score</div>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-[28px] font-bold text-black mb-1 tracking-tight flex items-center gap-2">
                42 <AlertTriangle className="w-5 h-5 text-[#FF9500]" />
              </div>
              <div className="text-[13px] text-[#8A8A8E] font-medium">Risk Alerts (Anon)</div>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-[28px] font-bold text-[#007AFF] mb-1 tracking-tight">85%</div>
              <div className="text-[13px] text-[#8A8A8E] font-medium">Login Rate (7d)</div>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="text-[28px] font-bold text-[#AF52DE] mb-1 tracking-tight">12</div>
              <div className="text-[13px] text-[#8A8A8E] font-medium">Help Requests</div>
            </GlassCard>
          </div>
        </section>

        {/* User Login Tracking List Mock */}
        <section>
          <h2 className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-2 ml-1">Recent Logins</h2>
          <GlassCard className="flex flex-col overflow-hidden">
            {["Alex R.", "Sarah M.", "David K.", "Anonymous"].map((name, i, arr) => (
              <div key={i} className={`flex items-center justify-between p-4 bg-white ${i !== arr.length - 1 ? 'border-b border-[#3C3C43]/[0.05]' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#E5E5EA] flex items-center justify-center text-[#8A8A8E]">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-[17px] font-semibold text-black tracking-tight">{name}</span>
                </div>
                <span className="text-[13px] font-medium text-[#8A8A8E]">Just now</span>
              </div>
            ))}
          </GlassCard>
        </section>

        {/* Push Notification Campaign */}
        <section>
          <h2 className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-2 ml-1">Push Campaigns</h2>
          <GlassCard className="p-5 bg-[#007AFF] text-white">
            <h3 className="font-bold text-[18px] mb-2 flex items-center gap-2 tracking-tight">
              <Send className="w-5 h-5" /> Announce Webinar
            </h3>
            <p className="text-[15px] text-white/90 mb-5 font-medium leading-snug">
              Push notification to all 102 active users to join the "Mindful Leadership" session tomorrow.
            </p>
            <button className="w-full py-3 bg-white text-[#007AFF] rounded-[14px] font-bold text-[17px] active:opacity-80 transition-opacity shadow-sm">
              Send Push
            </button>
          </GlassCard>
        </section>
      </main>
    </div>
  );
}
