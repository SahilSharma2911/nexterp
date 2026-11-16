import Link from "next/link";
import { Plus } from "lucide-react";
import { getSalesInvoices } from "@/actions/sales-invoice";
import { canWriteServer } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { SalesInvoicesTable } from "./columns";

export const dynamic = "force-dynamic";

export default async function SalesInvoiceListPage() {
  const rows = await getSalesInvoices();
  const writable = await canWriteServer("accounts");

  return (
    <>
      <PageHeader
        title="Sales Invoices"
        subtitle="Bill customers and post receivables"
        actions={
          writable ? (
            <Button asChild>
              <Link href="/accounts/sales-invoice/new">
                <Plus className="size-4" />
                New Sales Invoice
              </Link>
            </Button>
          ) : undefined
        }
      />
      <SalesInvoicesTable data={rows} />
    </>
  );
}
