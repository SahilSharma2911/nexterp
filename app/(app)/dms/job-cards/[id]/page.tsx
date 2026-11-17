import { JobCardDetail } from "@/modules/dms/job-cards/job-card-detail";

export const dynamic = "force-dynamic";

export default async function JobCardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <JobCardDetail jobId={id} />;
}
