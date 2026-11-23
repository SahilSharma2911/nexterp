import { PageHeader } from "@/components/page-header";
import { NewButton } from "@/components/new-button";
import { RecallsTable } from "@/modules/dms/recalls/recalls-table";
import { RecallAnalytics } from "@/modules/dms/recalls/recall-analytics";

export const metadata = { title: "Recall Campaigns · Seeka Motor" };

export const dynamic = "force-dynamic";

export default function RecallsPage() {
  return (
    <>
      <PageHeader
        title="Recall Campaigns"
        subtitle="OEM recalls — affected vehicles & remediation"
        actions={
          <NewButton href="/dms/recalls/new" label="New Recall" area="dms" />
        }
      />
      <div className="space-y-6">
        <RecallAnalytics />
        <RecallsTable />
      </div>
    </>
  );
}
