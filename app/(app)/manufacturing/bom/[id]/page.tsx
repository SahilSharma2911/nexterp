import { BomDetail } from "@/features/bom/bom-detail";

export const metadata = { title: "BOM · Seeka Motor" };

export default async function BomDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return <BomDetail bomId={id} />;
}
