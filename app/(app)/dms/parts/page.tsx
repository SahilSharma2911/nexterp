import { PageHeader } from "@/components/page-header";
import { PartsAccessoriesView } from "@/modules/dms/parts/parts-accessories-view";

export const metadata = { title: "Parts & Accessories · Seeka Motor" };

export const dynamic = "force-dynamic";

export default function PartsAccessoriesPage() {
  return (
    <>
      <PageHeader
        title="Parts & Accessories"
        subtitle="Spare parts and accessories stock (from Items)"
      />
      <PartsAccessoriesView />
    </>
  );
}
