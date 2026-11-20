import { PageHeader } from "@/components/page-header";
import { ItemForm } from "@/features/items/item-form";

export const metadata = { title: "New Item · Seeka Motor" };

export default function NewItemPage() {
  return (
    <>
      <PageHeader title="New Item" subtitle="Add an item to the catalogue" />
      <ItemForm />
    </>
  );
}
