import { SalesOrderDetail } from "@/features/sales-order/sales-order-detail";

export const metadata = { title: "Sales Order · nexterp" };

export default async function SalesOrderDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return <SalesOrderDetail orderId={id} />;
}
