import { motion } from "motion/react";
import { Shield, Bell, Settings, Building, ChevronRight, LogOut } from "lucide-react";
import { GlassCard } from "../components/GlassCard";
import { cn } from "../utils";
import { useNavigate } from "react-router";

export function ProfileScreen() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-8 p-6 pt-12 pb-32">
      <header className="flex items-center gap-4">
        <div className="w-[72px] h-[72px] rounded-full overflow-hidden border border-black/[0.05] shadow-sm shrink-0">
          <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80" alt="Alex" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-[28px] font-bold text-black tracking-tight leading-tight">Alex Rivera</h1>
          <p className="text-[15px] text-[#8A8A8E] font-medium flex items-center gap-1.5 mt-0.5">
            <Building className="w-4 h-4" /> ACME Corp
          </p>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="p-4 flex flex-col items-center justify-center min-h-[100px]">
          <div className="text-[28px] font-bold text-black mb-1 tracking-tight">12</div>
          <div className="text-[12px] font-semibold text-[#8A8A8E] uppercase tracking-wider">Day Streak</div>
        </GlassCard>
        <GlassCard className="p-4 flex flex-col items-center justify-center min-h-[100px]">
          <div className="text-[28px] font-bold text-black mb-1 tracking-tight">450</div>
          <div className="text-[12px] font-semibold text-[#8A8A8E] uppercase tracking-wider">Wellness Coins</div>
        </GlassCard>
      </div>

      {/* Settings List */}
      <section>
        <h2 className="text-[22px] font-bold text-black tracking-tight mb-3">Health Profile</h2>
        <GlassCard className="flex flex-col overflow-hidden">
          {[
            { icon: Shield, label: "Privacy & Consent", sub: "Manage HR data sharing", bg: "bg-[#34C759]" },
            { icon: Bell, label: "Notifications", sub: "Nudges & reminders", bg: "bg-[#FF3B30]" },
            { icon: Settings, label: "Account Settings", sub: "Profile details", bg: "bg-[#8E8E93]" },
            { icon: Building, label: "Admin Portal", sub: "HR dashboard mockup", bg: "bg-[#007AFF]", isLink: true },
          ].map((item, idx, arr) => (
            <div 
              key={item.label}
              onClick={() => item.isLink && navigate("/admin")}
              className={cn("px-4 py-3 flex items-center gap-4 bg-white cursor-pointer active:opacity-70 transition-opacity", idx !== arr.length - 1 && "border-b border-[#3C3C43]/[0.05]")}
            >
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", item.bg)}>
                <item.icon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[17px] text-black tracking-tight">{item.label}</h3>
                <p className="text-[13px] text-[#8A8A8E] font-medium mt-0.5">{item.sub}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-[#C6C6C8]" />
            </div>
          ))}
        </GlassCard>
      </section>

      <button onClick={() => navigate("/")} className="mt-2 active:opacity-70 transition-opacity">
        <GlassCard className="w-full flex items-center justify-center p-4">
           <span className="text-[17px] font-semibold text-[#FF3B30]">Sign Out</span>
        </GlassCard>
      </button>
    </div>
  );
}
