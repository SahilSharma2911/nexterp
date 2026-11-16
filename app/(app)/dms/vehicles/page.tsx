import { PageHeader } from "@/components/page-header";
import { VehiclesTable } from "@/modules/dms/vehicles/vehicles-table";

export const metadata = { title: "Vehicles · nexterp" };

export const dynamic = "force-dynamic";

export default function VehiclesPage() {
  return (
    <>
      <PageHeader
        title="Vehicles"
        subtitle="EV units — VIN, battery & motor lifecycle"
      />
      <VehiclesTable />
    </>
  );
}
