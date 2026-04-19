import { PageHeader, PlaceholderCard } from "@/components/portal-nav-shell";

export default function DiscoverPage() {
  return (
    <div>
      <PageHeader
        title="Discover"
        subtitle="Meditations, courses, and curated wellness content."
      />
      <PlaceholderCard
        title="Content catalog coming soon"
        description="We&apos;re building a searchable content library. For now, explore guided practices in the mobile app."
      />
    </div>
  );
}
