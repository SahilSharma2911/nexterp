import { NextResponse } from "next/server";
import { ZodError } from "zod";

// Server-only. Converts thrown errors into consistent JSON responses that the
// axios interceptor can read as `{ message }`.
export function errorResponse(e: unknown) {
  if (e instanceof ZodError) {
    return NextResponse.json(
      { message: e.issues[0]?.message ?? "Invalid input", issues: e.issues },
      { status: 422 },
    );
  }
  const message = e instanceof Error ? e.message : "Something went wrong";
  return NextResponse.json({ message }, { status: 400 });
}
