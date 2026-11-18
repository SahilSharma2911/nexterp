import { PageHeader } from "@/components/page-header";
import { TechnicianForm } from "@/modules/dms/technicians/technician-form";

export const metadata = { title: "Edit Technician · nexterp" };

export default async function EditTechnicianPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <PageHeader title="Edit Technician" subtitle="Update technician details" />
      <TechnicianForm technicianId={id} />
    </>
  );
}
