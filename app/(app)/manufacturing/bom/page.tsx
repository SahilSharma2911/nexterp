import { PageHeader } from "@/components/page-header";
import { BomsTable } from "@/features/bom/boms-table";

export const metadata = { title: "BOM · Seeka Motor" };

export const dynamic = "force-dynamic";

export default function BomListPage() {
  return (
    <>
      <PageHeader
        title="Bill of Materials"
        subtitle="Component recipes for manufactured items"
      />
      <BomsTable />
    </>
  );
}
