import { PageHeader } from "@/components/page-header";
import { SupplierForm } from "@/features/suppliers/supplier-form";

export const metadata = { title: "Edit Supplier · Seeka Motor" };

export default async function EditSupplierPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return (
    <>
      <PageHeader title="Edit Supplier" subtitle="Update the supplier" />
      <SupplierForm supplierId={id} />
    </>
  );
}
