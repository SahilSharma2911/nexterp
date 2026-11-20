import { PageHeader } from "@/components/page-header";
import { AllocationWorkspace } from "@/modules/dms/allocation/allocation-workspace";

export const metadata = { title: "Allocation · Seeka Motor" };

export const dynamic = "force-dynamic";

export default function AllocationPage() {
  return (
    <>
      <PageHeader
        title="Allocation"
        subtitle="FIFO engine — match stock to dealer demand"
      />
      <AllocationWorkspace />
    </>
  );
}
