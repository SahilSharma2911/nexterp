import { PageHeader } from "@/components/page-header";
import { PurchaseReceiptForm } from "@/features/purchase-receipt/purchase-receipt-form";

export const metadata = { title: "Edit Purchase Receipt · nexterp" };

export default async function EditPurchaseReceiptPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return (
    <>
      <PageHeader title="Edit Purchase Receipt" subtitle="Draft" />
      <PurchaseReceiptForm receiptId={id} />
    </>
  );
}
