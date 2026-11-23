import { PageHeader } from "@/components/page-header";
import { RecallForm } from "@/modules/dms/recalls/recall-form";

export const metadata = { title: "New Recall · Seeka Motor" };

export default function NewRecallPage() {
  return (
    <>
      <PageHeader title="New Recall" subtitle="Launch an OEM recall campaign" />
      <RecallForm />
    </>
  );
}
