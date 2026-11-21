import { NextResponse } from "next/server";
import { serviceBayDetail } from "@/lib/services/service-bays";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const detail = await serviceBayDetail(id);
  if (!detail)
    return NextResponse.json(
      { message: "Service bay not found" },
      { status: 404 },
    );
  return NextResponse.json(detail);
}
