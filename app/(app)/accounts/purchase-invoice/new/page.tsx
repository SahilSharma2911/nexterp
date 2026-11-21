import { PageHeader } from "@/components/page-header";
import { PurchaseInvoiceForm } from "@/features/purchase-invoice/purchase-invoice-form";

export const metadata = { title: "New Purchase Invoice · Seeka Motor" };

export default async function NewPurchaseInvoicePage(props: {
  searchParams: Promise<{ pr?: string }>;
}) {
  const { pr } = await props.searchParams;
  return (
    <>
      <PageHeader title="New Purchase Invoice" subtitle="Bill a supplier" />
      <PurchaseInvoiceForm prId={pr} />
    </>
  );
}
