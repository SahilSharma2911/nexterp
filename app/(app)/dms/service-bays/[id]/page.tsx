import { ServiceBayDetail } from "@/modules/dms/service-bays/service-bay-detail";

export const dynamic = "force-dynamic";

export default async function ServiceBayDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ServiceBayDetail bayId={id} />;
}
