import { PageHeader } from "@/components/page-header";
import { SerialForm } from "@/features/serials/serial-form";

export const metadata = { title: "New Serial · Seeka Motor" };

export default async function NewSerialPage({
  searchParams,
}: {
  searchParams: Promise<{ item?: string }>;
}) {
  const { item } = await searchParams;
  return (
    <>
      <PageHeader title="New Serial" subtitle="Register an individual unit" />
      <SerialForm prefillItemId={item} />
    </>
  );
}
