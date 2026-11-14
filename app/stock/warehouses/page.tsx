import { PageHeader } from "@/components/page-header";
import { WarehousesTable } from "@/features/warehouses/warehouses-table";

export const metadata = { title: "Warehouses · nexterp" };

export default function WarehousesPage() {
  return (
    <>
      <PageHeader title="Warehouses" subtitle="Stock locations" />
      <WarehousesTable />
    </>
  );
}
