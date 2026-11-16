import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { areaForPath, canWrite } from "@/lib/permissions";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAuthApi = pathname.startsWith("/api/auth/");
  const isLogin = pathname === "/login";

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  // --- not logged in ---
  if (!session) {
    if (isLogin || isAuthApi) return NextResponse.next();
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { message: "Please sign in." },
        { status: 401 },
      );
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  // --- logged in ---
  if (isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Write-gate: block mutations the role isn't allowed to make.
  if (MUTATING.has(req.method) && !isAuthApi) {
    const area = areaForPath(pathname);
    if (area && !canWrite(session.role, area)) {
      return NextResponse.json(
        { message: "You don't have permission to change this." },
        { status: 403 },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except Next internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.\\w+$).*)"],
};
