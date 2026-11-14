import { NextResponse, type NextRequest } from "next/server";
import { parseListParams } from "@/lib/api-list";
import { errorResponse } from "@/lib/api-server";
import { customerFormSchema } from "@/features/customers/schema";
import { createCustomer, listCustomers } from "@/lib/services/customers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const data = await listCustomers(parseListParams(req.nextUrl.searchParams));
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const values = customerFormSchema.parse(await req.json());
    const row = await createCustomer(values);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
