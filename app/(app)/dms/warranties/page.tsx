import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { WarrantiesTable } from "@/modules/dms/warranties/warranties-table";
import { WarrantyAnalytics } from "@/modules/dms/warranties/warranty-analytics";

export const metadata = { title: "Warranties · Seeka Motor" };

export const dynamic = "force-dynamic";

export default function WarrantiesPage() {
  return (
    <>
      <PageHeader
        title="Warranties"
        subtitle="Coverage registered at sale · claims & eligibility"
        actions={
          <Button asChild variant="outline">
            <Link href="/dms/warranties/analytics">
              <BarChart3 className="size-4" />
              Analytics
            </Link>
          </Button>
        }
      />
      <div className="space-y-6">
        <WarrantyAnalytics />
        <WarrantiesTable />
      </div>
    </>
  );
}
