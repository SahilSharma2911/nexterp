import { PageHeader } from "@/components/page-header";
import { SalesOrdersTable } from "@/features/sales-order/sales-orders-table";

export const metadata = { title: "Sales Orders · nexterp" };

export const dynamic = "force-dynamic";

export default function SalesOrderListPage() {
  return (
    <>
      <PageHeader title="Sales Orders" subtitle="Orders from customers" />
      <SalesOrdersTable />
    </>
  );
}
