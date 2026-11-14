import { getStockLedger } from "@/actions/reports";
import { PageHeader, Table, Th, Td } from "@/components/ui";
import { fmtQty, fmtRate, fmtMoney, fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function StockLedgerPage() {
  const rows = await getStockLedger();
  return (
    <>
      <PageHeader title="Stock Ledger" subtitle="Every stock movement, most recent first (max 500)" />
      <Table>
        <thead>
          <tr>
            <Th>Posting</Th><Th>Item</Th><Th>Warehouse</Th><Th>Voucher</Th>
            <Th className="text-right">In/Out</Th><Th className="text-right">Balance</Th>
            <Th className="text-right">Val. Rate</Th><Th className="text-right">Stock Value</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className={r.isCancelled ? "text-gray-400 line-through" : ""}>
              <Td className="whitespace-nowrap text-xs text-gray-500">{fmtDateTime(r.postingAt)}</Td>
              <Td><span className="font-mono text-xs">{r.itemCode}</span> <span className="text-gray-500">{r.itemName}</span></Td>
              <Td>{r.warehouse}</Td>
              <Td className="font-mono text-xs text-gray-500">{r.voucherNo}</Td>
              <Td className={"text-right font-medium " + (r.actualQty < 0 ? "text-red-600" : "text-green-700")}>{r.actualQty > 0 ? `+${fmtQty(r.actualQty)}` : fmtQty(r.actualQty)}</Td>
              <Td className="text-right">{fmtQty(r.qtyAfterTransaction)}</Td>
              <Td className="text-right">{fmtRate(r.valuationRate)}</Td>
              <Td className="text-right">{fmtMoney(r.stockValue)}</Td>
            </tr>
          ))}
          {rows.length === 0 && <tr><Td className="py-6 text-center text-gray-400">No ledger entries yet. Submit a Stock Entry.</Td><Td /><Td /><Td /><Td /><Td /><Td /><Td /></tr>}
        </tbody>
      </Table>
    </>
  );
}
