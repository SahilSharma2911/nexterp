import { PageHeader } from "@/components/page-header";
import { NewButton } from "@/components/new-button";
import { SuppliersTable } from "@/features/suppliers/suppliers-table";

export const metadata = { title: "Suppliers · Seeka Motor" };

export const dynamic = "force-dynamic";

export default function SuppliersPage() {
  return (
    <>
      <PageHeader
        title="Suppliers"
        subtitle="Vendors you buy from"
        actions={
          <NewButton
            href="/buying/suppliers/new"
            label="New Supplier"
            area="buying"
          />
        }
      />
      <SuppliersTable />
    </>
  );
}
