import { PageHeader } from "@/components/page-header";
import { NewButton } from "@/components/new-button";
import { ServiceBaysTable } from "@/modules/dms/service-bays/service-bays-table";
import { ServiceBaysDashboard } from "@/modules/dms/service-bays/service-bays-dashboard";

export const metadata = { title: "Service Bays · Seeka Motor" };

export const dynamic = "force-dynamic";

export default function ServiceBaysPage() {
  return (
    <>
      <PageHeader
        title="Service Bays"
        subtitle="Workshop bays — today's schedule & utilization"
        actions={
          <NewButton href="/dms/service-bays/new" label="New Bay" area="dms" />
        }
      />
      <div className="space-y-6">
        <ServiceBaysDashboard />
        <ServiceBaysTable />
      </div>
    </>
  );
}
