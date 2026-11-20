import { PageHeader } from "@/components/page-header";
import { VehicleForm } from "@/modules/dms/vehicles/vehicle-form";

export const metadata = { title: "Edit Vehicle · Seeka Motor" };

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <PageHeader title="Edit Vehicle" subtitle="Update EV unit details" />
      <VehicleForm vehicleId={id} />
    </>
  );
}
