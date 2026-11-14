import { getItemOptions } from "@/actions/items";
import { getSupplierOptions } from "@/actions/parties";
import { getWarehouseOptions } from "@/actions/warehouses";
import PrFormClient from "../PrFormClient";
export const dynamic = "force-dynamic";
export default async function NewPrPage() {
  const [items, suppliers, warehouses] = await Promise.all([getItemOptions(), getSupplierOptions(), getWarehouseOptions()]);
  return <PrFormClient items={items} suppliers={suppliers.map((s) => ({ id: s.id, name: s.supplierName }))} warehouses={warehouses.map((w) => ({ id: w.id, name: w.warehouseName }))} />;
}
