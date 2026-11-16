import { PageHeader } from "@/components/page-header";
import { DealersTable } from "@/modules/dms/dealers/dealers-table";

export const metadata = { title: "Dealers · nexterp" };

export const dynamic = "force-dynamic";

export default function DealersPage() {
  return (
    <>
      <PageHeader title="Dealers" subtitle="Dealership network" />
      <DealersTable />
    </>
  );
}
