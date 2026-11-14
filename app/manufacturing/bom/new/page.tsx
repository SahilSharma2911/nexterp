import { getItemOptions } from "@/actions/items";
import BomFormClient from "../BomFormClient";

export const dynamic = "force-dynamic";

export default async function NewBomPage() {
  const items = await getItemOptions();
  return <BomFormClient items={items} />;
}
