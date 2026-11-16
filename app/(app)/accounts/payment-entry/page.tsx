import Link from "next/link";
import { Plus } from "lucide-react";
import { getPaymentEntries } from "@/actions/payment-entry";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { PaymentEntriesTable } from "./columns";

export const dynamic = "force-dynamic";

export default async function PaymentEntryListPage() {
  const rows = await getPaymentEntries();

  return (
    <>
      <PageHeader
        title="Payment Entries"
        subtitle="Receipts from customers and payments to suppliers"
        actions={
          <Button asChild>
            <Link href="/accounts/payment-entry/new">
              <Plus className="size-4" />
              New Payment Entry
            </Link>
          </Button>
        }
      />
      <PaymentEntriesTable data={rows} />
    </>
  );
}
