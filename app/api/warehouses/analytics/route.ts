import { NextResponse } from "next/server";
import { warehouseAnalytics } from "@/lib/services/warehouses";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await warehouseAnalytics());
}
