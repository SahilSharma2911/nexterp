import { PageHeader } from "@/components/page-header";
import { WorkOrdersTable } from "@/features/work-order/work-orders-table";

export const metadata = { title: "Work Order · nexterp" };

export default function WorkOrderListPage() {
  return (
    <>
      <PageHeader
        title="Work Orders"
        subtitle="Manufacture finished goods from a BOM"
      />
      <WorkOrdersTable />
    </>
  );
}
