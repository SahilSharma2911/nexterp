import { NextResponse, type NextRequest } from "next/server";
import { parseListParams } from "@/lib/api-list";
import { errorResponse } from "@/lib/api-server";
import { stockEntryFormSchema } from "@/features/stock-entry/schema";
import {
  createStockEntry,
  listStockEntries,
} from "@/lib/services/stock-entry";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const data = await listStockEntries(parseListParams(sp), {
    status: sp.get("status") ?? undefined,
    purpose: sp.get("purpose") ?? undefined,
  });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const values = stockEntryFormSchema.parse(await req.json());
    const row = await createStockEntry(values);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
