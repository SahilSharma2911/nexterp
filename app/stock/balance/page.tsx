import { getStockBalance } from "@/actions/reports";
import { PageHeader, Table, Th, Td } from "@/components/ui";
import { fmtQty, fmtRate, fmtMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function StockBalancePage() {
  const rows = await getStockBalance();
  const totalValue = rows.reduce((s, r) => s + r.stockValue, 0);
  return (
    <>
      <PageHeader title="Stock Balance" subtitle="On-hand quantity & value per warehouse (from Bin)">
        <span className="text-sm text-gray-500">Total value: <span className="font-semibold text-gray-900">{fmtMoney(totalValue)}</span></span>
      </PageHeader>
      <Table>
        <thead>
          <tr><Th>Item</Th><Th>Warehouse</Th><Th className="text-right">Actual</Th><Th className="text-right">Reserved</Th><Th className="text-right">Ordered</Th><Th className="text-right">Projected</Th><Th className="text-right">Val. Rate</Th><Th className="text-right">Stock Value</Th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50">
              <Td><span className="font-mono text-xs">{r.itemCode}</span> <span className="text-gray-500">{r.itemName}</span></Td>
              <Td>{r.warehouse}</Td>
              <Td className="text-right font-medium">{fmtQty(r.actualQty)} {r.uom}</Td>
              <Td className="text-right text-gray-500">{r.reservedQty ? fmtQty(r.reservedQty) : "—"}</Td>
              <Td className="text-right text-gray-500">{r.orderedQty ? fmtQty(r.orderedQty) : "—"}</Td>
              <Td className="text-right">{fmtQty(r.projectedQty)}</Td>
              <Td className="text-right">{fmtRate(r.valuationRate)}</Td>
              <Td className="text-right">{fmtMoney(r.stockValue)}</Td>
            </tr>
          ))}
          {rows.length === 0 && <tr><Td className="py-6 text-center text-gray-400">No stock yet.</Td><Td /><Td /><Td /><Td /><Td /><Td /><Td /></tr>}
        </tbody>
      </Table>
    </>
  );
}
