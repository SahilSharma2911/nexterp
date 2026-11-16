import { PageHeader } from "@/components/page-header";
import { PurchaseInvoicesTable } from "@/features/purchase-invoice/purchase-invoices-table";

export const metadata = { title: "Purchase Invoices · nexterp" };

export const dynamic = "force-dynamic";

export default function PurchaseInvoiceListPage() {
  return (
    <>
      <PageHeader
        title="Purchase Invoices"
        subtitle="Bill suppliers and post payables"
      />
      <PurchaseInvoicesTable />
    </>
  );
}
