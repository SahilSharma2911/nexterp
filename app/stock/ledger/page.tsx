import { getStockLedger } from "@/actions/reports";
import { PageHeader } from "@/components/page-header";
import { StockLedgerTable } from "./columns";

export const dynamic = "force-dynamic";

export default async function StockLedgerPage() {
  const rows = await getStockLedger();

  return (
    <>
      <PageHeader
        title="Stock Ledger"
        subtitle="Every stock movement, most recent first (max 500)"
      />
      <StockLedgerTable data={rows} />
    </>
  );
}
