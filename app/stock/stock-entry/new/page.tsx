import { getItemOptions } from "@/actions/items";
import { getWarehouseOptions } from "@/actions/warehouses";
import StockEntryFormClient from "../StockEntryFormClient";

export const dynamic = "force-dynamic";

export default async function NewStockEntryPage() {
  const [items, warehouses] = await Promise.all([getItemOptions(), getWarehouseOptions()]);
  return <StockEntryFormClient items={items} warehouses={warehouses} />;
}
