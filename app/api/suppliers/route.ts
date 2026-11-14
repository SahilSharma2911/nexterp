import { NextResponse, type NextRequest } from "next/server";
import { parseListParams } from "@/lib/api-list";
import { errorResponse } from "@/lib/api-server";
import { supplierFormSchema } from "@/features/suppliers/schema";
import { createSupplier, listSuppliers } from "@/lib/services/suppliers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const data = await listSuppliers(parseListParams(req.nextUrl.searchParams));
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const values = supplierFormSchema.parse(await req.json());
    const row = await createSupplier(values);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
