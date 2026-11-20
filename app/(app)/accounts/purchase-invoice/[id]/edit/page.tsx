import { PageHeader } from "@/components/page-header";
import { PurchaseInvoiceForm } from "@/features/purchase-invoice/purchase-invoice-form";

export const metadata = { title: "Edit Purchase Invoice · Seeka Motor" };

export default async function EditPurchaseInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <PageHeader title="Edit Purchase Invoice" subtitle="Draft invoice" />
      <PurchaseInvoiceForm invoiceId={id} />
    </>
  );
}
