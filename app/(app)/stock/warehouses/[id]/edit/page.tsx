import { PageHeader } from "@/components/page-header";
import { WarehouseForm } from "@/features/warehouses/warehouse-form";

export const metadata = { title: "Edit Warehouse · nexterp" };

export default async function EditWarehousePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return (
    <>
      <PageHeader title="Edit Warehouse" subtitle="Update the warehouse" />
      <WarehouseForm warehouseId={id} />
    </>
  );
}
