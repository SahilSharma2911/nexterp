import { ItemDetail } from "@/features/items/item-detail";

export const metadata = { title: "Item · nexterp" };

export default async function ItemDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return <ItemDetail itemId={id} />;
}
