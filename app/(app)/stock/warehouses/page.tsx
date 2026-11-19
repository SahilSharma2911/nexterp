import { PageHeader } from "@/components/page-header";
import { NewButton } from "@/components/new-button";
import { WarehousesTable } from "@/features/warehouses/warehouses-table";
import { WarehouseAnalytics } from "@/features/warehouses/warehouse-analytics";

export const metadata = { title: "Warehouses · nexterp" };

export const dynamic = "force-dynamic";

export default function WarehousesPage() {
  return (
    <>
      <PageHeader
        title="Warehouses"
        subtitle="Stock locations"
        actions={
          <NewButton
            href="/stock/warehouses/new"
            label="New Warehouse"
            area="stock"
          />
        }
      />
      <div className="space-y-6">
        <WarehouseAnalytics />
        <WarehousesTable />
      </div>
    </>
  );
}
