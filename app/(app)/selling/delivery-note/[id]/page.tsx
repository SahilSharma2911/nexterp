import { DeliveryNoteDetail } from "@/features/delivery-note/delivery-note-detail";

export const metadata = { title: "Delivery Note · Seeka Motor" };

export default async function DeliveryNoteDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return <DeliveryNoteDetail noteId={id} />;
}
