import { PageHeader } from "@/components/page-header";
import { TechnicianForm } from "@/modules/dms/technicians/technician-form";

export const metadata = { title: "New Technician · nexterp" };

export default function NewTechnicianPage() {
  return (
    <>
      <PageHeader title="New Technician" subtitle="Add a workshop technician" />
      <TechnicianForm />
    </>
  );
}
