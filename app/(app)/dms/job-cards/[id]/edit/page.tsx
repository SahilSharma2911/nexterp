import { PageHeader } from "@/components/page-header";
import { JobCardForm } from "@/modules/dms/job-cards/job-card-form";

export const metadata = { title: "Edit Job Card · Seeka Motor" };

export default async function EditJobCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <PageHeader title="Edit Job Card" subtitle="Open job" />
      <JobCardForm jobId={id} />
    </>
  );
}
