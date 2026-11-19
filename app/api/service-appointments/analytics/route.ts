import { NextResponse } from "next/server";
import { serviceAppointmentAnalytics } from "@/lib/services/service-appointments";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await serviceAppointmentAnalytics());
}
