import { SchemeDetail } from "@/modules/dms/subsidy-schemes/scheme-detail";

export const dynamic = "force-dynamic";

export default async function SchemeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SchemeDetail schemeId={id} />;
}
