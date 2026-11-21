import { PageHeader } from "@/components/page-header";
import { SerialForm } from "@/features/serials/serial-form";

export const metadata = { title: "Edit Serial · Seeka Motor" };

export default async function EditSerialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <PageHeader title="Edit Serial" subtitle="Update unit details" />
      <SerialForm serialId={id} />
    </>
  );
}
