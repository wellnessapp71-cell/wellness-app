import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Sparkles, Building2, ChevronRight } from "lucide-react";
import { cn } from "../utils";
import { GlassCard } from "../components/GlassCard";

export function LoginScreen() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      if (code.toLowerCase() === 'admin') {
         navigate("/admin");
      } else {
         navigate("/app");
      }
    }, 1200);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F2F2F7] relative overflow-hidden sm:max-w-md sm:mx-auto sm:my-[5vh] sm:rounded-[40px] sm:h-[90vh] sm:min-h-0 sm:shadow-2xl sm:border-[10px] sm:border-[#1C1C1E]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex-1 flex flex-col items-center justify-center p-8 z-10"
      >
        <div className="w-20 h-20 bg-white rounded-3xl border border-black/[0.04] flex items-center justify-center mb-6 shadow-sm">
          <Sparkles className="w-10 h-10 text-[#007AFF]" />
        </div>
        
        <h1 className="text-[34px] font-bold tracking-tight text-black text-center mb-2">
          Aura
        </h1>
        <p className="text-[#8A8A8E] text-[17px] text-center mb-10 max-w-[260px] font-medium leading-snug">
          Your holistic wellness journey begins here.
        </p>

        <form onSubmit={handleLogin} className="w-full max-w-sm flex flex-col gap-6">
          <GlassCard className="p-4 flex flex-col gap-2">
            <label className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider flex items-center gap-1.5 ml-1">
              <Building2 className="w-4 h-4" />
              Company Referral Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. ACME-2026"
              className="w-full bg-[#E5E5EA]/50 border-none rounded-xl px-4 py-3 text-black text-[17px] placeholder:text-[#C6C6C8] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/50 transition-all font-medium"
            />
            <p className="text-[13px] text-[#8A8A8E] font-medium ml-1 mt-1">
              Hint: Use any code, or "admin".
            </p>
          </GlassCard>

          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={!code || isSubmitting}
            className={cn(
              "w-full py-4 rounded-[20px] font-bold text-[17px] flex items-center justify-center gap-2 transition-opacity",
              code ? "bg-[#007AFF] text-white shadow-md active:opacity-70" : "bg-[#E5E5EA] text-[#8A8A8E]"
            )}
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Continue
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
