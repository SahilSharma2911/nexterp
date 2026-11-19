import { PageHeader } from "@/components/page-header";
import { ItemsTable } from "@/features/items/items-table";
import { ItemAnalytics } from "@/features/items/item-analytics";

export const metadata = { title: "Items · nexterp" };

export const dynamic = "force-dynamic";

export default function ItemsPage() {
  return (
    <>
      <PageHeader
        title="Items"
        subtitle="Product and material master"
      />
      <div className="space-y-6">
        <ItemAnalytics />
        <ItemsTable />
      </div>
    </>
  );
}
