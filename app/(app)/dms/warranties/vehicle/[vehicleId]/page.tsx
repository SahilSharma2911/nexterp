import { WarrantyRegistration } from "@/modules/dms/warranties/warranty-registration";

export const metadata = { title: "Warranty Registration · Seeka Motor" };

export const dynamic = "force-dynamic";

export default async function WarrantyRegistrationPage({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const { vehicleId } = await params;
  return <WarrantyRegistration vehicleId={vehicleId} />;
}
