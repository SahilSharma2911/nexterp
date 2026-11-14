import { getSubmittedBomOptions } from "@/actions/bom";
import { getWarehouseOptions } from "@/actions/warehouses";
import WorkOrderFormClient from "../WorkOrderFormClient";

export const dynamic = "force-dynamic";

export default async function NewWorkOrderPage(props: { searchParams: Promise<{ bom?: string }> }) {
  const [{ bom }, boms, warehouses] = await Promise.all([props.searchParams, getSubmittedBomOptions(), getWarehouseOptions()]);
  return <WorkOrderFormClient boms={boms} warehouses={warehouses} defaultBomId={bom} />;
}
