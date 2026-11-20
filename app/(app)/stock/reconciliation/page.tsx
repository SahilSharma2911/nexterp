import { PageHeader } from "@/components/page-header";
import { ReconciliationsTable } from "@/features/stock-reconciliation/reconciliations-table";

export const metadata = { title: "Stock Reconciliation · Seeka Motor" };

export const dynamic = "force-dynamic";

export default function StockReconciliationPage() {
  return (
    <>
      <PageHeader
        title="Stock Reconciliation"
        subtitle="Set absolute on-hand quantities & valuation"
      />
      <ReconciliationsTable />
    </>
  );
}
