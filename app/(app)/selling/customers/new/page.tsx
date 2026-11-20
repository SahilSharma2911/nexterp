import { PageHeader } from "@/components/page-header";
import { CustomerForm } from "@/features/customers/customer-form";

export const metadata = { title: "New Customer · Seeka Motor" };

export default function NewCustomerPage() {
  return (
    <>
      <PageHeader title="New Customer" subtitle="Add a customer" />
      <CustomerForm />
    </>
  );
}
