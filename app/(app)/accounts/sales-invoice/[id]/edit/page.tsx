import { PageHeader } from "@/components/page-header";
import { SalesInvoiceForm } from "@/features/sales-invoice/sales-invoice-form";

export const metadata = { title: "Edit Sales Invoice · nexterp" };

export default async function EditSalesInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <PageHeader title="Edit Sales Invoice" subtitle="Draft invoice" />
      <SalesInvoiceForm invoiceId={id} />
    </>
  );
}
