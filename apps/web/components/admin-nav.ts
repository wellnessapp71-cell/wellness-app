import {
  Activity,
  AlertTriangle,
  BarChart3,
  BellRing,
  Boxes,
  Building2,
  FileText,
  Flag,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  Palette,
  Scale,
  ScrollText,
  ShieldCheck,
  Stethoscope,
  Trash2,
} from "lucide-react";
import type { NavItem } from "@/components/portal-nav-shell";

export const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Organizations", href: "/admin/organizations", icon: Building2 },
  { label: "HR Referral Codes", href: "/admin/referral-codes", icon: KeyRound },
  { label: "Live Events", href: "/admin/events", icon: BellRing },
  { label: "Complaints & Support", href: "/admin/complaints", icon: LifeBuoy },
  { label: "App Health", href: "/admin/incidents", icon: Activity },
  { label: "Professionals", href: "/admin/professionals", icon: Stethoscope },
  { label: "Click & Access Logs", href: "/admin/click-logs", icon: ScrollText },
  { label: "Consent & Approvals", href: "/admin/consent", icon: ShieldCheck },
  { label: "Reports & Exports", href: "/admin/reports", icon: FileText },
  { label: "Audit Log", href: "/admin/audit", icon: ScrollText },
  { label: "Org Settings & Branding", href: "/admin/branding", icon: Palette },
  { label: "Retention & Deletion", href: "/admin/retention", icon: Trash2 },
  { label: "Feature Flags", href: "/admin/feature-flags", icon: Flag },
  { label: "Data Quality Alerts", href: "/admin/data-quality", icon: AlertTriangle },
  { label: "Usage Benchmarking", href: "/admin/benchmarks", icon: BarChart3 },
  { label: "System Settings", href: "/admin/settings", icon: Boxes },
];

export const ADMIN_ROLE_LABEL = "Admin workspace";
