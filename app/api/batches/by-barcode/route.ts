import { NextResponse, type NextRequest } from "next/server";
import { batchByBarcode } from "@/lib/services/batches";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code") ?? "";
  return NextResponse.json(await batchByBarcode(code));
}
