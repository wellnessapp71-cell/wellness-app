import { SessionManagementPage } from "@/components/session-management-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SessionManagementPage requestId={id} />;
}
