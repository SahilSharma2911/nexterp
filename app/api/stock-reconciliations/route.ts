import { NextResponse, type NextRequest } from "next/server";
import { parseListParams } from "@/lib/api-list";
import { errorResponse } from "@/lib/api-server";
import { reconciliationFormSchema } from "@/features/stock-reconciliation/schema";
import {
  createStockReconciliation,
  listStockReconciliations,
} from "@/lib/services/stock-reconciliation";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const data = await listStockReconciliations(parseListParams(sp), {
    status: sp.get("status") ?? undefined,
  });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const values = reconciliationFormSchema.parse(await req.json());
    const row = await createStockReconciliation(values);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
