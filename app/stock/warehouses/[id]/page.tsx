import { notFound } from "next/navigation";
import { getWarehouse } from "@/actions/warehouses";
import WarehouseFormClient from "../WarehouseFormClient";

export const dynamic = "force-dynamic";

export default async function EditWarehousePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const w = await getWarehouse(id);
  if (!w) notFound();
  return <WarehouseFormClient warehouse={w} />;
}
