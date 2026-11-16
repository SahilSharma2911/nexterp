import { PurchaseInvoiceDetail } from "@/features/purchase-invoice/purchase-invoice-detail";

export const dynamic = "force-dynamic";

export default async function PurchaseInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PurchaseInvoiceDetail invoiceId={id} />;
}
