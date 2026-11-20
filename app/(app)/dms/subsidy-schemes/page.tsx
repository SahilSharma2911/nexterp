import { PageHeader } from "@/components/page-header";
import { SchemesTable } from "@/modules/dms/subsidy-schemes/schemes-table";

export const metadata = { title: "Subsidy Schemes · Seeka Motor" };

export const dynamic = "force-dynamic";

export default function SubsidySchemesPage() {
  return (
    <>
      <PageHeader title="Subsidy Schemes" subtitle="EV incentive programmes" />
      <SchemesTable />
    </>
  );
}
