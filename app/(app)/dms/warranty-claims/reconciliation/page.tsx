import { PageHeader } from "@/components/page-header";
import { ReconciliationView } from "@/modules/dms/reconciliation/reconciliation-view";

export const metadata = { title: "Reimbursement Reconciliation · Seeka Motor" };

export const dynamic = "force-dynamic";

export default function ReconciliationPage() {
  return (
    <>
      <PageHeader
        title="Reimbursement Reconciliation"
        subtitle="Match OEM credit notes to claims · aging · discrepancies"
      />
      <ReconciliationView />
    </>
  );
}
