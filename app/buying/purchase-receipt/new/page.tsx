import { getItemOptions } from "@/actions/items";
import { getSupplierOptions } from "@/actions/parties";
import { getWarehouseOptions } from "@/actions/warehouses";
import { getPoPrefill } from "@/actions/purchase-order";
import PrFormClient from "../PrFormClient";
export const dynamic = "force-dynamic";
export default async function NewPrPage(props: { searchParams: Promise<{ po?: string }> }) {
  const [{ po }, items, suppliers, warehouses] = await Promise.all([props.searchParams, getItemOptions(), getSupplierOptions(), getWarehouseOptions()]);
  const prefill = po ? await getPoPrefill(po) : null;
  return <PrFormClient items={items} suppliers={suppliers.map((s) => ({ id: s.id, name: s.supplierName }))} warehouses={warehouses.map((w) => ({ id: w.id, name: w.warehouseName }))} prefill={prefill ?? undefined} />;
}
