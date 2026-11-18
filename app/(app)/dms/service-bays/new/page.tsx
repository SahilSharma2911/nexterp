import { PageHeader } from "@/components/page-header";
import { ServiceBayForm } from "@/modules/dms/service-bays/service-bay-form";

export const metadata = { title: "New Service Bay · nexterp" };

export default function NewServiceBayPage() {
  return (
    <>
      <PageHeader title="New Service Bay" subtitle="Add a workshop bay" />
      <ServiceBayForm />
    </>
  );
}
