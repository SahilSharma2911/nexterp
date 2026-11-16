import { getGeneralLedger } from "@/actions/accounts-reports";
import { PageHeader } from "@/components/page-header";
import { GeneralLedgerTable } from "./columns";

export const dynamic = "force-dynamic";

export default async function GeneralLedgerPage() {
  const rows = await getGeneralLedger();

  return (
    <>
      <PageHeader
        title="General Ledger"
        subtitle="Every accounting entry, most recent first (max 500)"
      />
      <GeneralLedgerTable data={rows} />
    </>
  );
}
