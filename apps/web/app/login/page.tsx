import { Suspense } from "react";
import { PortalAuthPage } from "@/components/portal-auth-page";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <PortalAuthPage mode="login" />
    </Suspense>
  );
}
