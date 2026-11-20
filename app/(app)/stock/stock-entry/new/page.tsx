import { PageHeader } from "@/components/page-header";
import { StockEntryForm } from "@/features/stock-entry/stock-entry-form";

export const metadata = { title: "New Stock Entry · Seeka Motor" };

export default function NewStockEntryPage() {
  return (
    <>
      <PageHeader
        title="New Stock Entry"
        subtitle="Create a draft, then submit to post the stock ledger"
      />
      <StockEntryForm />
    </>
  );
}
