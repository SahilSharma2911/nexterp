import { PageHeader } from "@/components/page-header";
import { NewButton } from "@/components/new-button";
import { JobCardsTable } from "@/modules/dms/job-cards/job-cards-table";
import { JobCardAnalytics } from "@/modules/dms/job-cards/job-card-analytics";

export const metadata = { title: "Job Cards · nexterp" };

export const dynamic = "force-dynamic";

export default function JobCardsPage() {
  return (
    <>
      <PageHeader
        title="Job Cards"
        subtitle="Workshop — parts & labour against a vehicle"
        actions={
          <NewButton href="/dms/job-cards/new" label="New Job Card" area="dms" />
        }
      />
      <div className="space-y-6">
        <JobCardAnalytics />
        <JobCardsTable />
      </div>
    </>
  );
}
