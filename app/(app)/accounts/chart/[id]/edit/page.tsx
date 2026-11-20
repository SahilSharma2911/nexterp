import { PageHeader } from "@/components/page-header";
import { AccountForm } from "@/features/chart-of-accounts/account-form";

export const metadata = { title: "Edit Account · Seeka Motor" };

export default async function EditAccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <PageHeader title="Edit Account" subtitle="Update a ledger account" />
      <AccountForm accountId={id} />
    </>
  );
}
