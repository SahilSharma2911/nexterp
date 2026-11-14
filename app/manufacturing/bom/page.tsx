import { PageHeader } from "@/components/page-header";
import { BomsTable } from "@/features/bom/boms-table";

export const metadata = { title: "BOM · nexterp" };

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
