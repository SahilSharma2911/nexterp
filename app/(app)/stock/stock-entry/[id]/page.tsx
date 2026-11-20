import { StockEntryDetail } from "@/features/stock-entry/stock-entry-detail";

export const metadata = { title: "Stock Entry · Seeka Motor" };

export default async function StockEntryDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return <StockEntryDetail entryId={id} />;
}
