import { PageHeader } from "@/components/page-header";
import { NewButton } from "@/components/new-button";
import { TechniciansTable } from "@/modules/dms/technicians/technicians-table";
import { TechnicianAnalytics } from "@/modules/dms/technicians/technician-analytics";

export const metadata = { title: "Technicians · Seeka Motor" };

export const dynamic = "force-dynamic";

export default function TechniciansPage() {
  return (
    <>
      <PageHeader
        title="Technicians"
        subtitle="Workshop technicians"
        actions={
          <NewButton
            href="/dms/technicians/new"
            label="New Technician"
            area="dms"
          />
        }
      />
      <div className="space-y-6">
        <TechnicianAnalytics />
        <TechniciansTable />
      </div>
    </>
  );
}
