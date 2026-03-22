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
    <div className="flex flex-col h-screen max-w-md mx-auto relative bg-[#F2F2F7] overflow-hidden sm:rounded-[40px] sm:border-[10px] sm:border-[#1C1C1E] sm:h-[90vh] sm:mt-[5vh] shadow-2xl">
      <main className="flex-1 overflow-y-auto pb-28 scroll-smooth no-scrollbar">
        <Outlet />
      </main>

      <div className="absolute bottom-0 inset-x-0 z-50 pt-4 pb-8 px-6 bg-[#F2F2F7]/90 backdrop-blur-xl border-t border-black/[0.05]">
        <div className="flex justify-between items-center">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path || (tab.path === "/app" && location.pathname === "/app/");
            const Icon = tab.icon;
            return (
              <button
                key={tab.name}
                onClick={() => navigate(tab.path)}
                className={cn(
                  "relative flex flex-col items-center justify-center flex-1 transition-all duration-300",
                  isActive ? "text-[#FF2D55]" : "text-[#8A8A8E] hover:text-[#000000]"
                )}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className="mb-1" />
                <span className="text-[10px] font-semibold tracking-wide">
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
