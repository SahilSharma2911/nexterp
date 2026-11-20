import { PurchaseOrderDetail } from "@/features/purchase-order/purchase-order-detail";

export const metadata = { title: "Purchase Order · Seeka Motor" };

export default async function PurchaseOrderDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return <PurchaseOrderDetail orderId={id} />;
}
