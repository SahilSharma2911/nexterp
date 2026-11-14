import { PageHeader } from "@/components/page-header";
import { CustomerForm } from "@/features/customers/customer-form";

export const metadata = { title: "Edit Customer · nexterp" };

export default async function EditCustomerPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return (
    <>
      <PageHeader title="Edit Customer" subtitle="Update the customer" />
      <CustomerForm customerId={id} />
    </>
  );
}
