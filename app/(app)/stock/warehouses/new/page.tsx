import { PageHeader } from "@/components/page-header";
import { WarehouseForm } from "@/features/warehouses/warehouse-form";

export const metadata = { title: "New Warehouse · nexterp" };

export default function NewWarehousePage() {
  return (
    <>
      <PageHeader title="New Warehouse" subtitle="Add a stock location" />
      <WarehouseForm />
    </>
  );
}
