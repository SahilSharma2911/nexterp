import { PageHeader } from "@/components/page-header";
import { SchemeForm } from "@/modules/dms/subsidy-schemes/scheme-form";

export const metadata = { title: "New Scheme · nexterp" };

export default function NewSchemePage() {
  return (
    <>
      <PageHeader
        title="New Scheme"
        subtitle="Add an EV incentive programme"
      />
      <SchemeForm />
    </>
  );
}
