import { PageHeader } from "@/components/page-header";
import { BomForm } from "@/features/bom/bom-form";

export const metadata = { title: "New BOM · nexterp" };

export default function NewBomPage() {
  return (
    <>
      <PageHeader
        title="New BOM"
        subtitle="Define the component recipe, then submit to explode it"
      />
      <BomForm />
    </>
  );
}
