import { PageHeader } from "@/components/page-header";
import { SerialLabels } from "@/features/serials/serial-labels";

export const metadata = { title: "Serial Labels · Seeka Motor" };

export const dynamic = "force-dynamic";

export default function SerialLabelsPage() {
  return (
    <>
      <div className="no-print">
        <PageHeader
          title="Serial labels"
          subtitle="Printable barcode labels for every serial"
        />
      </div>
      <SerialLabels />
    </>
  );
}
