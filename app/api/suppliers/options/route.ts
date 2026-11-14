import { NextResponse } from "next/server";
import { supplierOptions } from "@/lib/services/suppliers";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await supplierOptions());
}
