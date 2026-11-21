import { NextResponse, type NextRequest } from "next/server";
import { vehicleByVin } from "@/lib/services/vehicle-lifecycle";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code") ?? "";
  return NextResponse.json(await vehicleByVin(code));
}
