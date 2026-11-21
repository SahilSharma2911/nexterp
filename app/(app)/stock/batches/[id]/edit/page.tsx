import { PageHeader } from "@/components/page-header";
import { BatchForm } from "@/features/batches/batch-form";

export const metadata = { title: "Edit Batch · Seeka Motor" };

export default async function EditBatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <PageHeader title="Edit Batch" subtitle="Update lot details" />
      <BatchForm batchId={id} />
    </>
  );
}
