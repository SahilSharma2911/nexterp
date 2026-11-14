import { PageHeader } from "@/components/page-header";
import { SupplierForm } from "@/features/suppliers/supplier-form";

export const metadata = { title: "New Supplier · nexterp" };

export default function NewSupplierPage() {
  return (
    <>
      <PageHeader title="New Supplier" subtitle="Add a supplier" />
      <SupplierForm />
    </>
  );
}
