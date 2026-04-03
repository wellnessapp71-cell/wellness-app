import { Suspense } from "react";
import { PortalAuthPage } from "@/components/portal-auth-page";

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <PortalAuthPage mode="signup" />
    </Suspense>
  );
}
