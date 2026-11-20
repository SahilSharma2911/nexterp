import { PageHeader } from "@/components/page-header";
import { ServiceBayForm } from "@/modules/dms/service-bays/service-bay-form";

export const metadata = { title: "Edit Service Bay · Seeka Motor" };

export default async function EditServiceBayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <PageHeader title="Edit Service Bay" subtitle="Update bay details" />
      <ServiceBayForm bayId={id} />
    </>
  );
}
