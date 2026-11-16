import { PageHeader } from "@/components/page-header";
import { PurchaseInvoiceForm } from "@/features/purchase-invoice/purchase-invoice-form";

export const metadata = { title: "New Purchase Invoice · nexterp" };

export default function NewPurchaseInvoicePage() {
  return (
    <>
      <PageHeader title="New Purchase Invoice" subtitle="Bill a supplier" />
      <PurchaseInvoiceForm />
    </>
  );
}
