import Link from "next/link";
import { Plus } from "lucide-react";
import { getStockReconciliations } from "@/actions/stock-reconciliation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ReconciliationTable } from "./columns";

export const dynamic = "force-dynamic";

export default async function StockReconciliationPage() {
  const rows = await getStockReconciliations();

  return (
    <>
      <PageHeader
        title="Stock Reconciliation"
        subtitle="Set absolute on-hand quantities & valuation"
        actions={
          <Button asChild>
            <Link href="/stock/reconciliation/new">
              <Plus className="size-4" />
              New Reconciliation
            </Link>
          </Button>
        }
      />
      <ReconciliationTable data={rows} />
    </>
  );
}
