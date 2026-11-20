import { PageHeader } from "@/components/page-header";
import { WorkOrderForm } from "@/features/work-order/work-order-form";

export const metadata = { title: "New Work Order · Seeka Motor" };

export default async function NewWorkOrderPage(props: {
  searchParams: Promise<{ bom?: string }>;
}) {
  const { bom } = await props.searchParams;
  return (
    <>
      <PageHeader
        title="New Work Order"
        subtitle="Pick a BOM and quantity, then finish production to post stock"
      />
      <WorkOrderForm defaultBomId={bom} />
    </>
  );
}
