import { PageHeader } from "@/components/page-header";
import { SalesOrderForm } from "@/features/sales-order/sales-order-form";

export const metadata = { title: "New Sales Order · nexterp" };

export default function NewSalesOrderPage() {
  return (
    <>
      <PageHeader
        title="New Sales Order"
        subtitle="Create a draft, then submit to reserve stock"
      />
      <SalesOrderForm />
    </>
  );
}
