import { PageHeader } from "@/components/page-header";
import { BatchLabels } from "@/features/batches/batch-labels";

export const metadata = { title: "Batch Labels · Seeka Motor" };

export const dynamic = "force-dynamic";

export default function BatchLabelsPage() {
  return (
    <>
      <div className="no-print">
        <PageHeader
          title="Batch labels"
          subtitle="Printable barcode labels for every batch"
        />
      </div>
      <BatchLabels />
    </>
  );
}
