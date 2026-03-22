import { Outlet, useLocation, useNavigate } from "react-router";
import { Home, Compass, Target, User } from "lucide-react";
import { cn } from "../utils";

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { name: "Home", path: "/app", icon: Home },
    { name: "Wheel", path: "/app/wheel", icon: Target },
    { name: "Discover", path: "/app/discover", icon: Compass },
    { name: "Profile", path: "/app/profile", icon: User },
  ];

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50 via-purple-50/50 to-emerald-50/30 overflow-hidden shadow-2xl shadow-indigo-500/10 sm:rounded-[3rem] sm:border-[8px] sm:border-slate-800 sm:h-[90vh] sm:mt-[5vh]">
      <main className="flex-1 overflow-y-auto pb-28 scroll-smooth no-scrollbar">
        <Outlet />
      </main>

      <div className="absolute bottom-6 inset-x-6 z-50">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-2 flex justify-between items-center shadow-[0_16px_40px_rgba(0,0,0,0.08)] border border-white/60">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path || (tab.path === "/app" && location.pathname === "/app/");
            const Icon = tab.icon;
            return (
              <button
                key={tab.name}
                onClick={() => navigate(tab.path)}
                className={cn(
                  "relative flex flex-col items-center justify-center flex-1 py-3 rounded-2xl transition-all duration-300",
                  isActive ? "text-indigo-600 bg-indigo-50/60 shadow-sm border border-indigo-100/50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/50"
                )}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className="mb-1" />
                <span className={cn("text-[10px] font-medium tracking-wide", isActive ? "opacity-100" : "opacity-0 h-0 overflow-hidden")}>
                  {tab.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
