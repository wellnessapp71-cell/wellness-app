import { PageHeader, PlaceholderCard } from "@/components/portal-nav-shell";

export default function LifestyleHubPage() {
  return (
    <div>
      <PageHeader
        title="Lifestyle"
        subtitle="Habits, sleep, and daily routines."
      />
      <PlaceholderCard
        title="Coming to web"
        description="Lifestyle coaching flows are available in the mobile app. The web version is in progress."
      />
    </div>
  );
}
