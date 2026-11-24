import Link from "next/link";
import { Printer } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { NewButton } from "@/components/new-button";
import { Button } from "@/components/ui/button";
import { SerialsTable } from "@/features/serials/serials-table";
import { SerialAnalytics } from "@/features/serials/serial-analytics";
import { SerialScanPanel } from "@/features/serials/serial-scan-panel";

export const metadata = { title: "Serial Numbers · Seeka Motor" };

export const dynamic = "force-dynamic";

export default function SerialsPage() {
  return (
    <>
      <PageHeader
        title="Serial Numbers"
        subtitle="Per-unit tracking for serialised items"
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/stock/serials/labels">
                <Printer className="size-4" />
                Print labels
              </Link>
            </Button>
            <NewButton href="/stock/serials/new" label="New Serial" area="stock" />
          </div>
        }
      />
      <div className="space-y-6">
        <SerialScanPanel />
        <SerialAnalytics />
        <SerialsTable />
      </div>
    </>
  );
}
