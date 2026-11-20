import { PageHeader } from "@/components/page-header";
import { TechniciansTable } from "@/modules/dms/technicians/technicians-table";

export const metadata = { title: "Technicians · Seeka Motor" };

export const dynamic = "force-dynamic";

export default function TechniciansPage() {
  return (
    <>
      <PageHeader title="Technicians" subtitle="Workshop technicians" />
      <TechniciansTable />
    </>
  );
}
