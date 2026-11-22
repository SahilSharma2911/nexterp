import { VehicleLabel } from "@/modules/dms/vehicles/vehicle-label";

export const metadata = { title: "VIN Label · Seeka Motor" };

export const dynamic = "force-dynamic";

export default async function VehicleLabelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <VehicleLabel vehicleId={id} />;
}
