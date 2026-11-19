import { PageHeader } from "@/components/page-header";
import { NewButton } from "@/components/new-button";
import { VehiclesTable } from "@/modules/dms/vehicles/vehicles-table";
import { VehicleAnalytics } from "@/modules/dms/vehicles/vehicle-analytics";

export const metadata = { title: "Vehicles · nexterp" };

export const dynamic = "force-dynamic";

export default function VehiclesPage() {
  return (
    <>
      <PageHeader
        title="Vehicles"
        subtitle="EV units — VIN, battery & motor lifecycle"
        actions={
          <NewButton href="/dms/vehicles/new" label="New Vehicle" area="dms" />
        }
      />
      <div className="space-y-6">
        <VehicleAnalytics />
        <VehiclesTable />
      </div>
    </>
  );
}
