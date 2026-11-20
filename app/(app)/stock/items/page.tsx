import { PageHeader } from "@/components/page-header";
import { NewButton } from "@/components/new-button";
import { ItemsTable } from "@/features/items/items-table";
import { ItemAnalytics } from "@/features/items/item-analytics";

export const metadata = { title: "Items · Seeka Motor" };

export const dynamic = "force-dynamic";

export default function ItemsPage() {
  return (
    <>
      <PageHeader
        title="Items"
        subtitle="Product and material master"
        actions={
          <NewButton href="/stock/items/new" label="New Item" area="stock" />
        }
      />
      <div className="space-y-6">
        <ItemAnalytics />
        <ItemsTable />
      </div>
    </>
  );
}
