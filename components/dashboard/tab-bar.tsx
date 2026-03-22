"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Target, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { name: "Home", path: "/dashboard", icon: Home },
  { name: "Wheel", path: "/wheel", icon: Target },
  { name: "Discover", path: "/discover", icon: Compass },
  { name: "Profile", path: "/profile", icon: User },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <div className="absolute bottom-0 inset-x-0 z-50 pt-4 pb-8 px-6 bg-[#F2F2F7]/90 backdrop-blur-xl border-t border-black/[0.05]">
      <div className="flex justify-between items-center">
        {tabs.map((tab) => {
          const isActive = pathname === tab.path;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.name}
              href={tab.path}
              className={cn(
                "relative flex flex-col items-center justify-center flex-1 transition-all duration-300",
                isActive
                  ? "text-[#FF2D55]"
                  : "text-[#8A8A8E] hover:text-[#000000]"
              )}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className="mb-1" />
              <span className="text-[10px] font-semibold tracking-wide">
                {tab.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
