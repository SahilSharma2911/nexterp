import { getItemOptions } from "@/actions/items";
import { getWarehouseOptions } from "@/actions/warehouses";
import { getStockBalance } from "@/actions/reports";
import ReconFormClient from "../ReconFormClient";

export const dynamic = "force-dynamic";

export default async function NewReconPage() {
  const [items, warehouses, bins] = await Promise.all([getItemOptions(), getWarehouseOptions(), getStockBalance()]);
  return <ReconFormClient items={items} warehouses={warehouses} bins={bins.map((b) => ({ itemCode: b.itemCode, warehouse: b.warehouse, actualQty: b.actualQty, valuationRate: b.valuationRate }))} />;
}
