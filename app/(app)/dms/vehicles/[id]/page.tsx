import { VehicleDetail } from "@/modules/dms/vehicles/vehicle-detail";

export const dynamic = "force-dynamic";

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <VehicleDetail vehicleId={id} />;
}
