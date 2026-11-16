import { PageHeader } from "@/components/page-header";
import { PaymentEntriesTable } from "@/features/payment-entry/payment-entries-table";

export const metadata = { title: "Payment Entries · nexterp" };

export const dynamic = "force-dynamic";

export default function PaymentEntryListPage() {
  return (
    <>
      <PageHeader
        title="Payment Entries"
        subtitle="Receipts from customers and payments to suppliers"
      />
      <PaymentEntriesTable />
    </>
  );
}
