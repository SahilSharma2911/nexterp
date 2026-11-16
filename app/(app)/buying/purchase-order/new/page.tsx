import { PageHeader } from "@/components/page-header";
import { PurchaseOrderForm } from "@/features/purchase-order/purchase-order-form";

export const metadata = { title: "New Purchase Order · nexterp" };

export default function NewPurchaseOrderPage() {
  return (
    <>
      <PageHeader
        title="New Purchase Order"
        subtitle="Create a draft, then submit to reserve ordered quantities"
      />
      <PurchaseOrderForm />
    </>
  );
}
