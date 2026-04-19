"use client";

import { PortalNavShell } from "@/components/portal-nav-shell";
import { EMPLOYEE_NAV, EMPLOYEE_ROLE_LABEL } from "@/components/employee-nav";

export default function EmployeeAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalNavShell role="employee" roleLabel={EMPLOYEE_ROLE_LABEL} navItems={EMPLOYEE_NAV}>
      {children}
    </PortalNavShell>
  );
}
