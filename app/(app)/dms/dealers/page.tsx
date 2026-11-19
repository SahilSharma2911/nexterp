import { PageHeader } from "@/components/page-header";
import { DealersTable } from "@/modules/dms/dealers/dealers-table";
import { DealerAnalytics } from "@/modules/dms/dealers/dealer-analytics";

export const metadata = { title: "Dealers · nexterp" };

export const dynamic = "force-dynamic";

export default function DealersPage() {
  return (
    <>
      <PageHeader title="Dealers" subtitle="Dealership network" />
      <div className="space-y-6">
        <DealerAnalytics />
        <DealersTable />
      </div>
    </>
  );
}
