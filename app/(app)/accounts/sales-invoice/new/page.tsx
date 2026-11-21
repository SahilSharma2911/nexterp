import { PageHeader } from "@/components/page-header";
import { SalesInvoiceForm } from "@/features/sales-invoice/sales-invoice-form";

export const metadata = { title: "New Sales Invoice · Seeka Motor" };

export default async function NewSalesInvoicePage(props: {
  searchParams: Promise<{ dn?: string }>;
}) {
  const { dn } = await props.searchParams;
  return (
    <>
      <PageHeader title="New Sales Invoice" subtitle="Bill a customer" />
      <SalesInvoiceForm dnId={dn} />
    </>
  );
}
