import { ReconciliationDetail } from "@/features/stock-reconciliation/reconciliation-detail";

export const metadata = { title: "Stock Reconciliation · nexterp" };

export default async function ReconciliationDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return <ReconciliationDetail reconId={id} />;
}
