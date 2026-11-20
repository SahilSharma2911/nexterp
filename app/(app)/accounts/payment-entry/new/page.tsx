import { PageHeader } from "@/components/page-header";
import { PaymentEntryForm } from "@/features/payment-entry/payment-entry-form";
import type { PaymentPrefill } from "@/features/payment-entry/schema";
import { getSalesInvoice } from "@/lib/services/sales-invoice";
import { getPurchaseInvoice } from "@/lib/services/purchase-invoice";

export const metadata = { title: "New Payment Entry · Seeka Motor" };

export const dynamic = "force-dynamic";

export default async function NewPaymentEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ si?: string; pi?: string }>;
}) {
  const { si, pi } = await searchParams;

  let prefill: PaymentPrefill | undefined;
  let invoiceLabel: string | undefined;

  if (si) {
    const inv = await getSalesInvoice(si);
    if (inv && inv.status === "SUBMITTED" && inv.outstanding > 0) {
      prefill = {
        paymentType: "RECEIVE",
        customerId: inv.customerId,
        salesInvoiceId: inv.id,
        amount: inv.outstanding,
      };
      invoiceLabel = inv.name;
    }
  } else if (pi) {
    const inv = await getPurchaseInvoice(pi);
    if (inv && inv.status === "SUBMITTED" && inv.outstanding > 0) {
      prefill = {
        paymentType: "PAY",
        supplierId: inv.supplierId,
        purchaseInvoiceId: inv.id,
        amount: inv.outstanding,
      };
      invoiceLabel = inv.name;
    }
  }

  return (
    <>
      <PageHeader
        title="New Payment Entry"
        subtitle="Record a receipt or a payment"
      />
      <PaymentEntryForm prefill={prefill} invoiceLabel={invoiceLabel} />
    </>
  );
}
