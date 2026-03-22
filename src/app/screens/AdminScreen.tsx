import { motion } from "motion/react";
import { ArrowLeft, Users, Send, TrendingUp, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router";
import { GlassCard } from "../components/GlassCard";

export function AdminScreen() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-50 overflow-y-auto pb-12 sm:rounded-[3rem] sm:h-[90vh] sm:border-[8px] sm:border-slate-800 sm:my-[5vh] sm:shadow-2xl">
      <header className="p-6 pt-12 pb-4 bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 active:scale-95 transition-transform">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-slate-800">HR Admin Portal</h1>
        </div>
        
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider">ACME Corp</span>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">102 Active Users</span>
        </div>
      </header>

      <main className="p-6 space-y-6">
        {/* Engagement Stats */}
        <section>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Overall Platform Health</h2>
          <div className="grid grid-cols-2 gap-4">
            <GlassCard className="p-4 bg-white/80">
              <div className="text-2xl font-bold text-slate-800 mb-1 flex items-center gap-2">
                74% <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-xs text-slate-500 font-medium">Avg Wheel Score</div>
            </GlassCard>
            <GlassCard className="p-4 bg-white/80">
              <div className="text-2xl font-bold text-slate-800 mb-1 flex items-center gap-2">
                42 <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xs text-slate-500 font-medium">Risk Alerts (Anon)</div>
            </GlassCard>
            <GlassCard className="p-4 bg-white/80">
              <div className="text-2xl font-bold text-indigo-600 mb-1">85%</div>
              <div className="text-xs text-slate-500 font-medium">Login Rate (7d)</div>
            </GlassCard>
            <GlassCard className="p-4 bg-white/80">
              <div className="text-2xl font-bold text-purple-600 mb-1">12</div>
              <div className="text-xs text-slate-500 font-medium">Help Requests</div>
            </GlassCard>
          </div>
        </section>

        {/* User Login Tracking List Mock */}
        <section>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Recent Logins (Opt-in)</h2>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            {["Alex R.", "Sarah M.", "David K.", "Anonymous"].map((name, i) => (
              <div key={i} className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{name}</span>
                </div>
                <span className="text-xs font-medium text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md">Just now</span>
              </div>
            ))}
          </div>
        </section>

        {/* Push Notification Campaign */}
        <section>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Push Campaigns</h2>
          <GlassCard className="p-5 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none">
            <h3 className="font-bold mb-1 flex items-center gap-2">
              <Send className="w-4 h-4" /> Announce Webinar
            </h3>
            <p className="text-sm text-indigo-100 mb-4 opacity-90 leading-relaxed">
              Push notification to all 102 active users to join the "Mindful Leadership" session tomorrow.
            </p>
            <button className="w-full py-3 bg-white text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors shadow-lg active:scale-95">
              Send Push Notification
            </button>
          </GlassCard>
        </section>
      </main>
    </div>
  );
}
