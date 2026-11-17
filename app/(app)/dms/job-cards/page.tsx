import { PageHeader } from "@/components/page-header";
import { JobCardsTable } from "@/modules/dms/job-cards/job-cards-table";

export const metadata = { title: "Job Cards · nexterp" };

export const dynamic = "force-dynamic";

export default function JobCardsPage() {
  return (
    <>
      <PageHeader
        title="Job Cards"
        subtitle="Workshop — parts & labour against a vehicle"
      />
      <JobCardsTable />
    </>
  );
}
