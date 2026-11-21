import { NextResponse } from "next/server";
import { technicianAnalytics } from "@/lib/services/technicians";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await technicianAnalytics());
}
