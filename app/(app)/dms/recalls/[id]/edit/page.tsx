import { PageHeader } from "@/components/page-header";
import { RecallForm } from "@/modules/dms/recalls/recall-form";

export const metadata = { title: "Edit Recall · Seeka Motor" };

export default async function EditRecallPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <PageHeader title="Edit Recall" subtitle="Update the recall campaign" />
      <RecallForm recallId={id} />
    </>
  );
}
