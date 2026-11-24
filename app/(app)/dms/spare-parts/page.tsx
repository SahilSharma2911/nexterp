import { PageHeader } from "@/components/page-header";
import { NewButton } from "@/components/new-button";
import { ItemsTable } from "@/features/items/items-table";
import { SPARE_PART_GROUP } from "@/features/items/item-groups";

export const metadata = { title: "Spare Parts · Seeka Motor" };

export const dynamic = "force-dynamic";

export default function SparePartsPage() {
  return (
    <>
      <PageHeader
        title="Spare Parts"
        subtitle="Replacement parts stock (items in the Spare Part group)"
        actions={
          <NewButton
            href={`/stock/items/new?group=${encodeURIComponent(SPARE_PART_GROUP)}`}
            label="New Spare Part"
            area="stock"
          />
        }
      />
      <ItemsTable group={SPARE_PART_GROUP} />
    </>
  );
}
