import { NextResponse, type NextRequest } from "next/server";
import { parseListParams } from "@/lib/api-list";
import { errorResponse } from "@/lib/api-server";
import { accountFormSchema } from "@/features/chart-of-accounts/schema";
import { createAccount, listAccounts } from "@/lib/services/chart-of-accounts";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const data = await listAccounts(parseListParams(req.nextUrl.searchParams));
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const values = accountFormSchema.parse(await req.json());
    const row = await createAccount(values);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
