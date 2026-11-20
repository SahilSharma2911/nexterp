import { PageHeader } from "@/components/page-header";
import { BomForm } from "@/features/bom/bom-form";

export const metadata = { title: "Edit BOM · Seeka Motor" };

export default async function EditBomPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return (
    <>
      <PageHeader title="Edit BOM" subtitle="Draft" />
      <BomForm bomId={id} />
    </>
  );
}
