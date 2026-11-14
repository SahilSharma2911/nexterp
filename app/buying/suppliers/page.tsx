import { PageHeader } from "@/components/page-header";
import { SuppliersTable } from "@/features/suppliers/suppliers-table";

export const metadata = { title: "Suppliers · nexterp" };

export const dynamic = "force-dynamic";

export default function SuppliersPage() {
  return (
    <>
      <PageHeader title="Suppliers" subtitle="Vendors you buy from" />
      <SuppliersTable />
    </>
  );
}
