import { PageHeader } from "@/components/page-header";
import { AccountForm } from "@/features/chart-of-accounts/account-form";

export const metadata = { title: "New Account · Seeka Motor" };

export default function NewAccountPage() {
  return (
    <>
      <PageHeader title="New Account" subtitle="Add a ledger account" />
      <AccountForm />
    </>
  );
}
