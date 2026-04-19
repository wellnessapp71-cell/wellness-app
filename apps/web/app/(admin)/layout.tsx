import { PortalNavShell } from "@/components/portal-nav-shell";
import { ADMIN_NAV, ADMIN_ROLE_LABEL } from "@/components/admin-nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalNavShell role="admin" roleLabel={ADMIN_ROLE_LABEL} navItems={ADMIN_NAV}>
      {children}
    </PortalNavShell>
  );
}
