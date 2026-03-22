import { motion } from "motion/react";
import { User, Settings, Shield, Bell, LogOut, ArrowRight, Building } from "lucide-react";
import { GlassCard } from "../components/GlassCard";
import { useNavigate } from "react-router";

export function ProfileScreen() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6 p-6 pt-12 pb-32">
      <header className="flex flex-col items-center justify-center text-center mt-4 mb-6">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          className="relative mb-4"
        >
          <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl rotate-3">
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80" alt="Alex" className="w-full h-full object-cover -rotate-3 scale-110" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border-2 border-white">
            Level 5
          </div>
        </motion.div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Alex Rivera</h1>
        <p className="text-slate-500 font-medium text-sm flex items-center justify-center gap-1 mt-1">
          <Building className="w-3.5 h-3.5" /> ACME Corp
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <GlassCard className="p-4 text-center">
          <div className="text-3xl font-bold text-indigo-600 mb-1">12</div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Day Streak</div>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <div className="text-3xl font-bold text-emerald-500 mb-1">450</div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Wellness Coins</div>
        </GlassCard>
      </div>

      {/* Settings List */}
      <div className="space-y-3">
        {[
          { icon: Shield, label: "Privacy & Consent", sub: "Manage HR data sharing", action: () => {} },
          { icon: Bell, label: "Notifications", sub: "Nudges & reminders", action: () => {} },
          { icon: Settings, label: "Account Settings", sub: "Profile details", action: () => {} },
          { icon: Building, label: "Admin Portal", sub: "HR dashboard mockup", action: () => navigate("/admin"), color: "text-indigo-600" },
        ].map((item, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={item.label}
          >
            <GlassCard 
              className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/90 transition-all group active:scale-[0.98]"
              onClick={item.action}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.color ? "bg-indigo-50" : "bg-slate-100"}`}>
                <item.icon className={`w-5 h-5 ${item.color || "text-slate-600"}`} />
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold text-sm ${item.color || "text-slate-800"}`}>{item.label}</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{item.sub}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 transition-colors" />
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <motion.button 
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate("/")}
        className="mt-8 flex items-center justify-center gap-2 text-rose-500 font-medium text-sm hover:bg-rose-50 p-4 rounded-2xl transition-colors"
      >
        <LogOut className="w-4 h-4" /> Sign Out
      </motion.button>
    </div>
  );
}
