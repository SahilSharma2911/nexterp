import { PageHeader } from "@/components/page-header";
import { DealerForm } from "@/modules/dms/dealers/dealer-form";

export const metadata = { title: "New Dealer · Seeka Motor" };

export default function NewDealerPage() {
  return (
    <>
      <PageHeader title="New Dealer" subtitle="Add a dealership to the network" />
      <DealerForm />
    </>
  );
}
