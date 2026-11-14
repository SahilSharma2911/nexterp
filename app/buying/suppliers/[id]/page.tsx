import { notFound } from "next/navigation";
import { getSupplier } from "@/actions/parties";
import SupplierFormClient from "../SupplierFormClient";
export const dynamic = "force-dynamic";
export default async function EditSupplierPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const s = await getSupplier(id);
  if (!s) notFound();
  return <SupplierFormClient supplier={s} />;
}
