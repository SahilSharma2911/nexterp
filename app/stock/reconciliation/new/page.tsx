import { PageHeader } from "@/components/page-header";
import { ReconciliationForm } from "@/features/stock-reconciliation/reconciliation-form";

export const metadata = { title: "New Reconciliation · nexterp" };

export default function NewReconciliationPage() {
  return (
    <>
      <PageHeader
        title="New Stock Reconciliation"
        subtitle="Enter counted quantities, then submit to adjust stock"
      />
      <ReconciliationForm />
    </>
  );
}
