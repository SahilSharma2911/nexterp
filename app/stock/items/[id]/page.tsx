import { notFound } from "next/navigation";
import { getItem } from "@/actions/items";
import ItemFormClient from "../ItemFormClient";

export const dynamic = "force-dynamic";

export default async function EditItemPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const item = await getItem(id);
  if (!item) notFound();
  return <ItemFormClient item={item} />;
}
