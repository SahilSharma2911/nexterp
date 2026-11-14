import { NextResponse } from "next/server";
import { warehouseOptions } from "@/lib/services/warehouses";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await warehouseOptions());
}
