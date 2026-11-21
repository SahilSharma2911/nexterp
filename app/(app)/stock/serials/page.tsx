import { PageHeader } from "@/components/page-header";
import { NewButton } from "@/components/new-button";
import { SerialsTable } from "@/features/serials/serials-table";
import { SerialAnalytics } from "@/features/serials/serial-analytics";
import { SerialScanPanel } from "@/features/serials/serial-scan-panel";

export const metadata = { title: "Serial Numbers · Seeka Motor" };

export const dynamic = "force-dynamic";

export default function SerialsPage() {
  return (
    <>
      <PageHeader
        title="Serial Numbers"
        subtitle="Per-unit tracking for serialised items"
        actions={
          <NewButton href="/stock/serials/new" label="New Serial" area="stock" />
        }
      />
      <div className="space-y-6">
        <SerialScanPanel />
        <SerialAnalytics />
        <SerialsTable />
      </div>
    </>
  );
}
