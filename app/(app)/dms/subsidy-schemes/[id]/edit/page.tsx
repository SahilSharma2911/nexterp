import { PageHeader } from "@/components/page-header";
import { SchemeForm } from "@/modules/dms/subsidy-schemes/scheme-form";

export const metadata = { title: "Edit Scheme · nexterp" };

export default async function EditSchemePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <PageHeader title="Edit Scheme" subtitle="Update scheme details" />
      <SchemeForm schemeId={id} />
    </>
  );
}
