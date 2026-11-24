import { PageHeader } from "@/components/page-header";
import { ItemLabel } from "@/features/items/item-label";

export const metadata = { title: "Item Labels · Seeka Motor" };

export const dynamic = "force-dynamic";

export default async function ItemLabelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <div className="no-print">
        <PageHeader title="Print Item Labels" subtitle="Barcode labels" />
      </div>
      <ItemLabel itemId={id} />
    </>
  );
}
