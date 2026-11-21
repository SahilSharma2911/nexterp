import { NextResponse } from "next/server";
import { batchAnalytics } from "@/lib/services/batches";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await batchAnalytics());
}
