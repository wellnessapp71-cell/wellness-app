import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Sparkles, ArrowRight, Building2 } from "lucide-react";
import { cn } from "../utils";

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
    <div className="flex flex-col min-h-screen bg-slate-950 text-white relative overflow-hidden sm:max-w-md sm:mx-auto sm:my-[5vh] sm:rounded-[3rem] sm:h-[90vh] sm:min-h-0 sm:shadow-2xl sm:shadow-indigo-500/20">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-20%] w-[500px] h-[500px] bg-indigo-500/30 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-20%] w-[400px] h-[400px] bg-emerald-500/20 rounded-full blur-[100px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex-1 flex flex-col items-center justify-center p-8 z-10"
      >
        <div className="w-20 h-20 bg-white/10 rounded-3xl backdrop-blur-md border border-white/20 flex items-center justify-center mb-8 shadow-2xl">
          <Sparkles className="w-10 h-10 text-indigo-300" />
        </div>
        
        <h1 className="text-4xl font-semibold tracking-tight text-center mb-3">
          Aura
        </h1>
        <p className="text-slate-400 text-center mb-12 max-w-[260px] text-lg font-light">
          Your holistic wellness journey begins here.
        </p>

        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Company Referral Code
            </label>
            <div className="relative">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. ACME-2026"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all backdrop-blur-sm"
              />
            </div>
            <p className="text-xs text-slate-500 ml-1">
              Hint: Use any code to enter, or "admin" for HR portal.
            </p>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={!code || isSubmitting}
            className={cn(
              "w-full py-4 rounded-2xl font-medium flex items-center justify-center gap-2 transition-all duration-300",
              code ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-400" : "bg-white/5 text-slate-500"
            )}
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Continue to Assessment
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
