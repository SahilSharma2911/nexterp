import { PageHeader } from "@/components/page-header";
import { WarrantyForm } from "@/modules/dms/warranties/warranty-form";

export const metadata = { title: "New Warranty · nexterp" };

export default function NewWarrantyPage() {
  return (
    <>
      <PageHeader
        title="New Warranty"
        subtitle="Register component coverage for a vehicle"
      />
      <WarrantyForm />
    </>
  );
}
