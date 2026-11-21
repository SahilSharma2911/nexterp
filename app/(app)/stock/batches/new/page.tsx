import { PageHeader } from "@/components/page-header";
import { BatchForm } from "@/features/batches/batch-form";

export const metadata = { title: "New Batch · Seeka Motor" };

export default async function NewBatchPage({
  searchParams,
}: {
  searchParams: Promise<{ item?: string }>;
}) {
  const { item } = await searchParams;
  return (
    <>
      <PageHeader title="New Batch" subtitle="Record a lot with its expiry" />
      <BatchForm prefillItemId={item} />
    </>
  );
}
