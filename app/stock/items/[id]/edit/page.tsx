import { PageHeader } from "@/components/page-header";
import { ItemForm } from "@/features/items/item-form";

export const metadata = { title: "Edit Item · nexterp" };

export default async function EditItemPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return (
    <>
      <PageHeader title="Edit Item" subtitle="Update the item master" />
      <ItemForm itemId={id} />
    </>
  );
}
