import { getItemOptions } from "@/actions/items";
import { getSupplierOptions } from "@/actions/parties";
import PiFormClient from "../PiFormClient";
export const dynamic = "force-dynamic";
export default async function NewPiPage() {
  const [items, suppliers] = await Promise.all([getItemOptions(), getSupplierOptions()]);
  return <PiFormClient items={items} suppliers={suppliers.map((s) => ({ id: s.id, name: s.supplierName }))} />;
}
