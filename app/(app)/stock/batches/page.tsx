import { PageHeader } from "@/components/page-header";
import { NewButton } from "@/components/new-button";
import { BatchesTable } from "@/features/batches/batches-table";
import { BatchAnalytics } from "@/features/batches/batch-analytics";
import { BatchScanPanel } from "@/features/batches/batch-scan-panel";

export const metadata = { title: "Batches · Seeka Motor" };

export const dynamic = "force-dynamic";

export default function BatchesPage() {
  return (
    <>
      <PageHeader
        title="Batches"
        subtitle="Lot & expiry tracking for batched items"
        actions={
          <NewButton href="/stock/batches/new" label="New Batch" area="stock" />
        }
      />
      <div className="space-y-6">
        <BatchScanPanel />
        <BatchAnalytics />
        <BatchesTable />
      </div>
    </>
  );
}
