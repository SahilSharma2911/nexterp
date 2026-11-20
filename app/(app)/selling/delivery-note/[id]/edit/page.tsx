import { PageHeader } from "@/components/page-header";
import { DeliveryNoteForm } from "@/features/delivery-note/delivery-note-form";

export const metadata = { title: "Edit Delivery Note · Seeka Motor" };

export default async function EditDeliveryNotePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return (
    <>
      <PageHeader title="Edit Delivery Note" subtitle="Draft" />
      <DeliveryNoteForm noteId={id} />
    </>
  );
}
