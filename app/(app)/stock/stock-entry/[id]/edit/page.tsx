import { PageHeader } from "@/components/page-header";
import { StockEntryForm } from "@/features/stock-entry/stock-entry-form";

export const metadata = { title: "Edit Stock Entry · Seeka Motor" };

export default async function EditStockEntryPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return (
    <>
      <PageHeader title="Edit Stock Entry" subtitle="Draft" />
      <StockEntryForm entryId={id} />
    </>
  );
}
