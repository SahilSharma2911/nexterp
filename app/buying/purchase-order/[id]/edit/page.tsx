import { PageHeader } from "@/components/page-header";
import { PurchaseOrderForm } from "@/features/purchase-order/purchase-order-form";

export const metadata = { title: "Edit Purchase Order · nexterp" };

export default async function EditPurchaseOrderPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return (
    <>
      <PageHeader title="Edit Purchase Order" subtitle="Draft" />
      <PurchaseOrderForm orderId={id} />
    </>
  );
}
