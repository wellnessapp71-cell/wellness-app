import {
  Activity,
  BrainCircuit,
  Calendar,
  Compass,
  Leaf,
  LayoutDashboard,
  LifeBuoy,
  Settings,
  Sparkles,
  UserRound,
} from "lucide-react";
import type { NavItem } from "@/components/portal-nav-shell";

export const EMPLOYEE_NAV: NavItem[] = [
  { label: "Dashboard", href: "/app", icon: LayoutDashboard },
  { label: "Physical", href: "/app/physical", icon: Activity },
  { label: "Mental", href: "/app/mental", icon: BrainCircuit },
  { label: "Inner Calm", href: "/app/spiritual", icon: Sparkles },
  { label: "Lifestyle", href: "/app/lifestyle", icon: Leaf },
  { label: "Check-ins", href: "/app/checkins", icon: Calendar },
  { label: "Discover", href: "/app/discover", icon: Compass },
  { label: "Support", href: "/app/support", icon: LifeBuoy },
  { label: "Profile", href: "/app/profile", icon: UserRound },
  { label: "Settings", href: "/app/settings", icon: Settings },
];

export const EMPLOYEE_ROLE_LABEL = "My wellness";
