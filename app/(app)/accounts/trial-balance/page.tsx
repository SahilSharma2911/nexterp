import { getTrialBalance } from "@/actions/accounts-reports";
import { PageHeader } from "@/components/page-header";
import { fmtMoney } from "@/lib/format";
import { TrialBalanceTable } from "./columns";

export const dynamic = "force-dynamic";

export default async function TrialBalancePage() {
  const { rows, totalDr, totalCr } = await getTrialBalance();
  const balanced = Math.abs(totalDr - totalCr) < 0.01;

  return (
    <>
      <PageHeader
        title="Trial Balance"
        subtitle="Closing balance per account"
        actions={
          <span className="text-sm text-muted-foreground">
            Dr{" "}
            <span className="font-semibold text-foreground">{fmtMoney(totalDr)}</span>
            {"  ·  "}
            Cr{" "}
            <span className="font-semibold text-foreground">{fmtMoney(totalCr)}</span>
            {"  "}
            <span
              className={
                balanced
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }
            >
              {balanced ? "✓ balanced" : "⚠ unbalanced"}
            </span>
          </span>
        }
      />
      <TrialBalanceTable data={rows} />
    </>
  );
}
