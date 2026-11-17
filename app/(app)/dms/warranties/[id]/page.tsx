import { WarrantyDetail } from "@/modules/dms/warranties/warranty-detail";

export const dynamic = "force-dynamic";

export default async function WarrantyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WarrantyDetail warrantyId={id} />;
}
