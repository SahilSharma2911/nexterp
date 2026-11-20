import { PageHeader } from "@/components/page-header";
import { CustomersTable } from "@/features/customers/customers-table";

export const metadata = { title: "Customers · Seeka Motor" };

export const dynamic = "force-dynamic";

export default function CustomersPage() {
  return (
    <>
      <PageHeader title="Customers" subtitle="Parties you sell to" />
      <CustomersTable />
    </>
  );
}
