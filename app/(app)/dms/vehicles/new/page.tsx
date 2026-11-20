import { PageHeader } from "@/components/page-header";
import { VehicleForm } from "@/modules/dms/vehicles/vehicle-form";

export const metadata = { title: "Add Vehicle · Seeka Motor" };

export default function NewVehiclePage() {
  return (
    <>
      <PageHeader title="Add Vehicle" subtitle="Register an EV unit" />
      <VehicleForm />
    </>
  );
}
