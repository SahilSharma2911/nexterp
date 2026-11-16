import { PageHeader } from "@/components/page-header";
import { PurchaseReceiptsTable } from "@/features/purchase-receipt/purchase-receipts-table";

export const metadata = { title: "Purchase Receipts · nexterp" };

export const dynamic = "force-dynamic";

export default function PurchaseReceiptListPage() {
  return (
    <>
      <PageHeader
        title="Purchase Receipts"
        subtitle="Receive goods into stock"
      />
      <PurchaseReceiptsTable />
    </>
  );
}
