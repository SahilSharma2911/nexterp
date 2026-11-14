import { getItemOptions } from "@/actions/items";
import { getCustomerOptions } from "@/actions/parties";
import { getWarehouseOptions } from "@/actions/warehouses";
import DnFormClient from "../DnFormClient";
export const dynamic = "force-dynamic";
export default async function NewDnPage() {
  const [items, customers, warehouses] = await Promise.all([getItemOptions(), getCustomerOptions(), getWarehouseOptions()]);
  return <DnFormClient items={items} customers={customers.map((c) => ({ id: c.id, name: c.customerName }))} warehouses={warehouses.map((w) => ({ id: w.id, name: w.warehouseName }))} />;
}
