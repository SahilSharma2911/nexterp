import { PageHeader } from "@/components/page-header";
import { StockEntriesTable } from "@/features/stock-entry/stock-entries-table";

export const metadata = { title: "Stock Entry · nexterp" };

export default function StockEntryListPage() {
  return (
    <>
      <PageHeader
        title="Stock Entry"
        subtitle="Receipt · Issue · Transfer · Manufacture"
      />
      <StockEntriesTable />
    </>
  );
}
