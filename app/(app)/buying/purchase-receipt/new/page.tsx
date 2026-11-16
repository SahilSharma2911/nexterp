import { PageHeader } from "@/components/page-header";
import { PurchaseReceiptForm } from "@/features/purchase-receipt/purchase-receipt-form";

export const metadata = { title: "New Purchase Receipt · nexterp" };

export default async function NewPurchaseReceiptPage(props: {
  searchParams: Promise<{ po?: string }>;
}) {
  const { po } = await props.searchParams;
  return (
    <>
      <PageHeader
        title="New Purchase Receipt"
        subtitle="Receive goods, then submit to post the stock ledger"
      />
      <PurchaseReceiptForm poId={po} />
    </>
  );
}
