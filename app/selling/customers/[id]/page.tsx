import { notFound } from "next/navigation";
import { getCustomer } from "@/actions/parties";
import CustomerFormClient from "../CustomerFormClient";
export const dynamic = "force-dynamic";
export default async function EditCustomerPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const c = await getCustomer(id);
  if (!c) notFound();
  return <CustomerFormClient customer={c} />;
}
