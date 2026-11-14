import { NextResponse, type NextRequest } from "next/server";
import { parseListParams } from "@/lib/api-list";
import { errorResponse } from "@/lib/api-server";
import { itemFormSchema } from "@/features/items/schema";
import { createItem, listItems } from "@/lib/services/items";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const params = parseListParams(req.nextUrl.searchParams);
  const data = await listItems(params);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const values = itemFormSchema.parse(await req.json());
    const item = await createItem(values);
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
