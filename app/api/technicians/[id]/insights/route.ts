import { NextResponse } from "next/server";
import { technicianDetail } from "@/lib/services/technicians";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const detail = await technicianDetail(id);
  if (!detail)
    return NextResponse.json({ message: "Technician not found" }, { status: 404 });
  return NextResponse.json(detail);
}
