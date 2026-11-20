import { PageHeader } from "@/components/page-header";
import { SalesInvoiceForm } from "@/features/sales-invoice/sales-invoice-form";

export const metadata = { title: "New Sales Invoice · Seeka Motor" };

export default function NewSalesInvoicePage() {
  return (
    <>
      <PageHeader title="New Sales Invoice" subtitle="Bill a customer" />
      <SalesInvoiceForm />
    </>
  );
}
