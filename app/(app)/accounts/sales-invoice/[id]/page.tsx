import { SalesInvoiceDetail } from "@/features/sales-invoice/sales-invoice-detail";

export const dynamic = "force-dynamic";

export default async function SalesInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SalesInvoiceDetail invoiceId={id} />;
}
