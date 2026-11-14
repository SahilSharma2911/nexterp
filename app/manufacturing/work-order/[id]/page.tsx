import { WorkOrderDetail } from "@/features/work-order/work-order-detail";

export const metadata = { title: "Work Order · nexterp" };

export default async function WorkOrderDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return <WorkOrderDetail workOrderId={id} />;
}
