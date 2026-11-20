import { PageHeader } from "@/components/page-header";
import { PurchaseOrdersTable } from "@/features/purchase-order/purchase-orders-table";

export const metadata = { title: "Purchase Orders · Seeka Motor" };

export const dynamic = "force-dynamic";

export default function PurchaseOrderListPage() {
  return (
    <>
      <PageHeader title="Purchase Orders" subtitle="Order goods from suppliers" />
      <PurchaseOrdersTable />
    </>
  );
}
