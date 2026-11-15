import { getStockBalance } from "@/actions/reports";
import { PageHeader } from "@/components/page-header";
import { fmtMoney } from "@/lib/format";
import { StockBalanceTable } from "./columns";

export const dynamic = "force-dynamic";

export default async function StockBalancePage() {
  const rows = await getStockBalance();
  const totalValue = rows.reduce((s, r) => s + r.stockValue, 0);

  return (
    <>
      <PageHeader
        title="Stock Balance"
        subtitle="On-hand quantity & value per warehouse (from Bin)"
        actions={
          <span className="text-sm text-muted-foreground">
            Total value:{" "}
            <span className="font-semibold text-foreground">
              {fmtMoney(totalValue)}
            </span>
          </span>
        }
      />
      <StockBalanceTable data={rows} />
    </>
  );
}
