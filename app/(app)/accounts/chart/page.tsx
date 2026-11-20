import { PageHeader } from "@/components/page-header";
import { ChartTable } from "@/features/chart-of-accounts/chart-table";

export const metadata = { title: "Chart of Accounts · Seeka Motor" };

export const dynamic = "force-dynamic";

export default function ChartPage() {
  return (
    <>
      <PageHeader title="Chart of Accounts" subtitle="Ledger accounts" />
      <ChartTable />
    </>
  );
}
