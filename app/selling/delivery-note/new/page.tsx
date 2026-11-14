import { getItemOptions } from "@/actions/items";
import { getCustomerOptions } from "@/actions/parties";
import { getWarehouseOptions } from "@/actions/warehouses";
import { getSoPrefill } from "@/actions/sales-order";
import DnFormClient from "../DnFormClient";
export const dynamic = "force-dynamic";
export default async function NewDnPage(props: { searchParams: Promise<{ so?: string }> }) {
  const [{ so }, items, customers, warehouses] = await Promise.all([props.searchParams, getItemOptions(), getCustomerOptions(), getWarehouseOptions()]);
  const prefill = so ? await getSoPrefill(so) : null;
  return <DnFormClient items={items} customers={customers.map((c) => ({ id: c.id, name: c.customerName }))} warehouses={warehouses.map((w) => ({ id: w.id, name: w.warehouseName }))} prefill={prefill ?? undefined} />;
}
