import { PageHeader } from "@/components/page-header";
import { ServiceBaysTable } from "@/modules/dms/service-bays/service-bays-table";

export const metadata = { title: "Service Bays · Seeka Motor" };

export const dynamic = "force-dynamic";

export default function ServiceBaysPage() {
  return (
    <>
      <PageHeader title="Service Bays" subtitle="Workshop bays" />
      <ServiceBaysTable />
    </>
  );
}
