import Link from "next/link";
import { Plus } from "lucide-react";
import { getPurchaseInvoices } from "@/actions/purchase-invoice";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { PurchaseInvoicesTable } from "./columns";

export const dynamic = "force-dynamic";

export default async function PurchaseInvoiceListPage() {
  const rows = await getPurchaseInvoices();

  return (
    <>
      <PageHeader
        title="Purchase Invoices"
        subtitle="Record supplier bills and post payables"
        actions={
          <Button asChild>
            <Link href="/accounts/purchase-invoice/new">
              <Plus className="size-4" />
              New Purchase Invoice
            </Link>
          </Button>
        }
      />
      <PurchaseInvoicesTable data={rows} />
    </>
  );
}
