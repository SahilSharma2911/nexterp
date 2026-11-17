import { PageHeader } from "@/components/page-header";
import { WarrantyForm } from "@/modules/dms/warranties/warranty-form";

export const metadata = { title: "Edit Warranty · nexterp" };

export default async function EditWarrantyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <PageHeader title="Edit Warranty" subtitle="Update coverage details" />
      <WarrantyForm warrantyId={id} />
    </>
  );
}
