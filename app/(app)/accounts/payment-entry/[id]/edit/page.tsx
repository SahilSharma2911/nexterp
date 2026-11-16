import { PageHeader } from "@/components/page-header";
import { PaymentEntryForm } from "@/features/payment-entry/payment-entry-form";

export const metadata = { title: "Edit Payment Entry · nexterp" };

export default async function EditPaymentEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <PageHeader title="Edit Payment Entry" subtitle="Draft payment" />
      <PaymentEntryForm paymentId={id} />
    </>
  );
}
