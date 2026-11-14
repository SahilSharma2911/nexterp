import { getItemOptions } from "@/actions/items";
import { getCustomerOptions } from "@/actions/parties";
import SiFormClient from "../SiFormClient";
export const dynamic = "force-dynamic";
export default async function NewSiPage() {
  const [items, customers] = await Promise.all([getItemOptions(), getCustomerOptions()]);
  return <SiFormClient items={items} customers={customers.map((c) => ({ id: c.id, name: c.customerName }))} />;
}
