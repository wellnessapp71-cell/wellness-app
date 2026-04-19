"use client";

import { PortalNavShell } from "@/components/portal-nav-shell";
import { HR_NAV, HR_ROLE_LABEL } from "@/components/hr-nav";

export default function HrLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalNavShell role="hr" roleLabel={HR_ROLE_LABEL} navItems={HR_NAV}>
      {children}
    </PortalNavShell>
  );
}
