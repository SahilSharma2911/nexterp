import { PageHeader } from "@/components/page-header";
import { DeliveryNotesTable } from "@/features/delivery-note/delivery-notes-table";

export const metadata = { title: "Delivery Notes · Seeka Motor" };

export const dynamic = "force-dynamic";

export default function DeliveryNoteListPage() {
  return (
    <>
      <PageHeader title="Delivery Notes" subtitle="Ship goods to customers" />
      <DeliveryNotesTable />
    </>
  );
}
