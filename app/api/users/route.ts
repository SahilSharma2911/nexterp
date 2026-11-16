import { NextResponse, type NextRequest } from "next/server";
import { parseListParams } from "@/lib/api-list";
import { errorResponse } from "@/lib/api-server";
import { userCreateSchema } from "@/features/users/schema";
import { createUser, listUsers } from "@/lib/services/users";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const data = await listUsers(parseListParams(req.nextUrl.searchParams));
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const values = userCreateSchema.parse(await req.json());
    const row = await createUser(values);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
