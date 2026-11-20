import { PageHeader } from "@/components/page-header";
import { ReconciliationForm } from "@/features/stock-reconciliation/reconciliation-form";

export const metadata = { title: "Edit Reconciliation · Seeka Motor" };

export default async function EditReconciliationPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return (
    <>
      <PageHeader title="Edit Stock Reconciliation" subtitle="Draft" />
      <ReconciliationForm reconId={id} />
    </>
  );
}
