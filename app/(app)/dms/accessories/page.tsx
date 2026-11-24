import { PageHeader } from "@/components/page-header";
import { NewButton } from "@/components/new-button";
import { ItemsTable } from "@/features/items/items-table";
import { ACCESSORY_GROUP } from "@/features/items/item-groups";

export const metadata = { title: "Accessories · Seeka Motor" };

export const dynamic = "force-dynamic";

export default function AccessoriesPage() {
  return (
    <>
      <PageHeader
        title="Accessories"
        subtitle="Add-ons & fitments (items in the Accessory group)"
        actions={
          <NewButton
            href={`/stock/items/new?group=${encodeURIComponent(ACCESSORY_GROUP)}`}
            label="New Accessory"
            area="stock"
          />
        }
      />
      <ItemsTable group={ACCESSORY_GROUP} />
    </>
  );
}
