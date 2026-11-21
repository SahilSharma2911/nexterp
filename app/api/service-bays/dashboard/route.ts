import { NextResponse } from "next/server";
import { serviceBayDashboard } from "@/lib/services/service-bays";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await serviceBayDashboard());
}
