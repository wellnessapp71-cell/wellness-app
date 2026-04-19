import { PageHeader, PlaceholderCard } from "@/components/portal-nav-shell";

export default function MentalHubPage() {
  return (
    <div>
      <PageHeader
        title="Mental"
        subtitle="Mood tracking, journaling, and CBT-informed exercises."
      />
      <PlaceholderCard
        title="Coming to web"
        description="Mental pillar tools are currently mobile-first. Use the mobile app for check-ins and guided sessions."
      />
    </div>
  );
}
