import { PageHeader } from "@/components/page-header";
import { NewButton } from "@/components/new-button";
import { DealersTable } from "@/modules/dms/dealers/dealers-table";
import { DealerAnalytics } from "@/modules/dms/dealers/dealer-analytics";

export const metadata = { title: "Dealers · nexterp" };

export const dynamic = "force-dynamic";

export default function DealersPage() {
  return (
    <>
      <PageHeader
        title="Dealers"
        subtitle="Dealership network"
        actions={
          <NewButton href="/dms/dealers/new" label="New Dealer" area="dms" />
        }
      />
      <div className="space-y-6">
        <DealerAnalytics />
        <DealersTable />
      </div>
    </>
  );
}
