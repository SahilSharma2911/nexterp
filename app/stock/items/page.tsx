import { PageHeader } from "@/components/page-header";
import { ItemsTable } from "@/features/items/items-table";

export const metadata = { title: "Items · nexterp" };

export default function ItemsPage() {
  return (
    <>
      <PageHeader
        title="Items"
        subtitle="Product and material master"
      />
      <ItemsTable />
    </>
  );
}
