import { PageHeader } from "@/components/page-header";
import { WorkOrderForm } from "@/features/work-order/work-order-form";

export const metadata = { title: "New Work Order · nexterp" };

export default function NewWorkOrderPage() {
  return (
    <>
      <PageHeader
        title="New Work Order"
        subtitle="Pick a BOM and quantity, then finish production to post stock"
      />
      <WorkOrderForm />
    </>
  );
}
