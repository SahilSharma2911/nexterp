import { getItemOptions } from "@/actions/items";
import { getSupplierOptions } from "@/actions/parties";
import { getWarehouseOptions } from "@/actions/warehouses";
import PoFormClient from "../PoFormClient";
export const dynamic = "force-dynamic";
export default async function NewPoPage() {
  const [items, suppliers, warehouses] = await Promise.all([getItemOptions(), getSupplierOptions(), getWarehouseOptions()]);
  return <PoFormClient items={items} suppliers={suppliers.map((s) => ({ id: s.id, name: s.supplierName }))} warehouses={warehouses.map((w) => ({ id: w.id, name: w.warehouseName }))} />;
}
