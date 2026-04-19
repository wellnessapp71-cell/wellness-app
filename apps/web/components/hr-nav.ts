import {
  BarChart3,
  BellRing,
  Building2,
  CalendarClock,
  FileText,
  GraduationCap,
  HeartPulse,
  LayoutDashboard,
  LifeBuoy,
  MessageSquare,
  ScrollText,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { NavItem } from "@/components/portal-nav-shell";

export const HR_NAV: NavItem[] = [
  { label: "Dashboard", href: "/hr", icon: LayoutDashboard },
  { label: "Organization Health", href: "/hr/health", icon: HeartPulse },
  { label: "Department Drilldown", href: "/hr/departments", icon: Building2 },
  { label: "Help Requests", href: "/hr/requests", icon: LifeBuoy },
  { label: "Employee Profile", href: "/hr/employees", icon: UserRound },
  { label: "Training Assignments", href: "/hr/training", icon: GraduationCap },
  { label: "Live Events Calendar", href: "/hr/events", icon: CalendarClock },
  { label: "Usage Analytics", href: "/hr/analytics", icon: BarChart3 },
  { label: "Reports & Exports", href: "/hr/reports", icon: FileText },
  { label: "Messages & Complaints", href: "/hr/messages", icon: MessageSquare },
  { label: "Consent Status", href: "/hr/consent", icon: ShieldCheck },
  { label: "Audit History", href: "/hr/audit", icon: ScrollText },
  { label: "Notifications", href: "/hr/notifications", icon: BellRing },
];

export const HR_ROLE_LABEL = "HR workspace";
