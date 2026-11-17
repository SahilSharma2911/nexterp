import { PageHeader } from "@/components/page-header";
import { JobCardForm } from "@/modules/dms/job-cards/job-card-form";

export const metadata = { title: "New Job Card · nexterp" };

export const dynamic = "force-dynamic";

export default async function NewJobCardPage({
  searchParams,
}: {
  searchParams: Promise<{ vehicle?: string }>;
}) {
  const { vehicle } = await searchParams;
  return (
    <>
      <PageHeader title="New Job Card" subtitle="Open a workshop job" />
      <JobCardForm prefillVehicleId={vehicle} />
    </>
  );
}
