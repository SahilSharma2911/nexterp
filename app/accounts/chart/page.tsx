import Link from "next/link";
import { Plus } from "lucide-react";
import { getAccounts } from "@/actions/accounts";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { AccountsTable } from "./columns";
import { SeedAccountsButton } from "./ChartClients";

export const dynamic = "force-dynamic";

export default async function ChartPage() {
  const rows = await getAccounts();

  return (
    <>
      <PageHeader
        title="Chart of Accounts"
        subtitle="Ledger accounts"
        actions={
          <>
            {rows.length === 0 && <SeedAccountsButton />}
            <Button asChild>
              <Link href="/accounts/chart/new">
                <Plus className="size-4" />
                New Account
              </Link>
            </Button>
          </>
        }
      />
      <AccountsTable data={rows} />
    </>
  );
}
