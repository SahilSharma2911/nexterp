import { PageHeader } from "@/components/page-header";
import { SalesInvoicesTable } from "@/features/sales-invoice/sales-invoices-table";

export const metadata = { title: "Sales Invoices · nexterp" };

export const dynamic = "force-dynamic";

export default function SalesInvoiceListPage() {
  return (
    <>
      <PageHeader
        title="Sales Invoices"
        subtitle="Bill customers and post receivables"
      />
      <SalesInvoicesTable />
    </>
  );
}
