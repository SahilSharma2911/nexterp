import { PurchaseReceiptDetail } from "@/features/purchase-receipt/purchase-receipt-detail";

export const metadata = { title: "Purchase Receipt · nexterp" };

export default async function PurchaseReceiptDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return <PurchaseReceiptDetail receiptId={id} />;
}
