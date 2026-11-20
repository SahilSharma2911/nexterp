import { WarehouseDetail } from "@/features/warehouses/warehouse-detail";

export const metadata = { title: "Warehouse · Seeka Motor" };

export default async function WarehouseDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return <WarehouseDetail warehouseId={id} />;
}
