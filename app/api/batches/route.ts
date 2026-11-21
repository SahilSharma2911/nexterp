import { NextResponse, type NextRequest } from "next/server";
import { parseListParams } from "@/lib/api-list";
import { errorResponse } from "@/lib/api-server";
import { batchFormSchema } from "@/features/batches/schema";
import { createBatch, listBatches } from "@/lib/services/batches";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const data = await listBatches(parseListParams(sp), {
    itemId: sp.get("itemId") ?? undefined,
    expiry: sp.get("expiry") ?? undefined,
  });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const values = batchFormSchema.parse(await req.json());
    const batch = await createBatch(values);
    return NextResponse.json(batch, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
