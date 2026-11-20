import { PageHeader } from "@/components/page-header";
import { DeliveryNoteForm } from "@/features/delivery-note/delivery-note-form";

export const metadata = { title: "New Delivery Note · Seeka Motor" };

export default async function NewDeliveryNotePage(props: {
  searchParams: Promise<{ so?: string }>;
}) {
  const { so } = await props.searchParams;
  return (
    <>
      <PageHeader
        title="New Delivery Note"
        subtitle="Ship goods, then submit to issue stock and post COGS"
      />
      <DeliveryNoteForm soId={so} />
    </>
  );
}
