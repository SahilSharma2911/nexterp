import { PaymentEntryDetail } from "@/features/payment-entry/payment-entry-detail";

export const dynamic = "force-dynamic";

export default async function PaymentEntryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PaymentEntryDetail paymentId={id} />;
}
