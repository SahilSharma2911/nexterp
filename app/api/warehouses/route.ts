import { NextResponse, type NextRequest } from "next/server";
import { parseListParams } from "@/lib/api-list";
import { errorResponse } from "@/lib/api-server";
import { warehouseFormSchema } from "@/features/warehouses/schema";
import { createWarehouse, listWarehouses } from "@/lib/services/warehouses";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const data = await listWarehouses(parseListParams(req.nextUrl.searchParams));
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const values = warehouseFormSchema.parse(await req.json());
    const row = await createWarehouse(values);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
