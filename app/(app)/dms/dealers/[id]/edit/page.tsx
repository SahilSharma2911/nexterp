import { PageHeader } from "@/components/page-header";
import { DealerForm } from "@/modules/dms/dealers/dealer-form";

export const metadata = { title: "Edit Dealer · nexterp" };

export default async function EditDealerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <PageHeader title="Edit Dealer" subtitle="Update dealership details" />
      <DealerForm dealerId={id} />
    </>
  );
}
