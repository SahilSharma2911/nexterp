import { PageHeader } from "@/components/page-header";
import { SalesOrderForm } from "@/features/sales-order/sales-order-form";

export const metadata = { title: "Edit Sales Order · nexterp" };

export default async function EditSalesOrderPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return (
    <>
      <PageHeader title="Edit Sales Order" subtitle="Draft" />
      <SalesOrderForm orderId={id} />
    </>
  );
}
