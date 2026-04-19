import { PageHeader, PlaceholderCard } from "@/components/portal-nav-shell";

export default function PhysicalHubPage() {
  return (
    <div>
      <PageHeader
        title="Physical"
        subtitle="Workouts, nutrition, and body composition tracking."
      />
      <PlaceholderCard
        title="Coming to web"
        description="Full workout plans and nutrition logging are being ported from the mobile app. Track progress on the dashboard in the meantime."
      />
    </div>
  );
}
