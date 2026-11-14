import { notFound } from "next/navigation";
import { getAccounts } from "@/actions/accounts";
import { AccountFormClient } from "../ChartClients";
export const dynamic = "force-dynamic";
export default async function EditAccountPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const a = (await getAccounts()).find((x) => x.id === id);
  if (!a) notFound();
  return <AccountFormClient account={a} />;
}
