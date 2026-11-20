import { PageHeader } from "@/components/page-header";
import { WarrantiesTable } from "@/modules/dms/warranties/warranties-table";

export const metadata = { title: "Warranties · Seeka Motor" };

export const dynamic = "force-dynamic";

export default function WarrantiesPage() {
  return (
    <>
      <PageHeader title="Warranties" subtitle="Component coverage" />
      <WarrantiesTable />
    </>
  );
}
