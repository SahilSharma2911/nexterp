import { PageHeader } from "@/components/page-header";
import { ItemForm } from "@/features/items/item-form";

export const metadata = { title: "New Item · Seeka Motor" };

export default async function NewItemPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const { group } = await searchParams;
  return (
    <>
      <PageHeader
        title={group ? `New ${group}` : "New Item"}
        subtitle="Add an item to the catalogue"
      />
      <ItemForm defaultGroup={group} />
    </>
  );
}
