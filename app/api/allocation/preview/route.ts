import { NextResponse } from "next/server";
import { previewAllocation } from "@/lib/services/allocation";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await previewAllocation());
}
