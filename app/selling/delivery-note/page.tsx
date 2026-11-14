import { PageHeader } from "@/components/page-header";
import { DeliveryNotesTable } from "@/features/delivery-note/delivery-notes-table";

export const metadata = { title: "Delivery Notes · nexterp" };

export default function DeliveryNoteListPage() {
  return (
    <>
      <PageHeader title="Delivery Notes" subtitle="Ship goods to customers" />
      <DeliveryNotesTable />
    </>
  );
}
